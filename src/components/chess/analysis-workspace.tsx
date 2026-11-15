"use client";
/* eslint-disable @next/next/no-img-element -- a local blob preview must preserve the uploaded image's native aspect ratio. */

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  ChevronUp,
  Clipboard,
  FileImage,
  Flame,
  Info,
  LoaderCircle,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { Chess, type PieceSymbol, type Square } from "chess.js";
import { ChessBoard } from "@/components/chess/board";
import type { AnalysisResult, EngineLine } from "@/lib/chess/analysis-types";
import {
  PIECE_CODES,
  PIECE_GLYPHS,
  PIECE_NAMES,
  boardFromFen,
  boardToFen,
  emptyBoard,
  validatePositionFen,
  type BoardOrientation,
  type CastlingRight,
  type PositionBoard,
  type SideToMove,
  type SquareValue,
} from "@/lib/chess/position";
import { SAMPLE_POSITIONS } from "@/lib/chess/samples";
import { readDepth, writeDepth, type AnalysisDepth } from "@/lib/chess/preferences";
import { saveAnalysisToHistory } from "@/lib/chess/history";

type RecognitionResponse = {
  success?: boolean;
  status?: string;
  code?: string;
  error?: string;
  message?: string;
  detection?: {
    confidence: number;
    bounds: { x: number; y: number; width: number; height: number };
    squareSize: number;
    squareHints: { square: string; activity: number; likelyPiece: boolean }[];
  };
};

type ApiError = { success?: boolean; error?: string; message?: string; code?: string; status?: string };
type FinishedResponse = { success: true; status: "finished"; result: string; message: string; fen: string; bestMove: null };

const PIECE_OPTIONS = PIECE_CODES.map((code) => ({ code, label: PIECE_NAMES[code], glyph: PIECE_GLYPHS[code] }));
const CASTLING_OPTIONS: { key: CastlingRight; label: string }[] = [
  { key: "K", label: "White O-O" },
  { key: "Q", label: "White O-O-O" },
  { key: "k", label: "Black O-O" },
  { key: "q", label: "Black O-O-O" },
];

function rotateSquare(square: string) {
  return `${String.fromCharCode(104 - (square.charCodeAt(0) - 97))}${9 - Number(square[1])}`;
}

function errorMessage(response: Response, data: ApiError) {
  if (response.status === 429) return "Analysis limit reached. Wait a minute and try again.";
  return data.error || data.message || "The request could not be completed. Check your connection and try again.";
}

export function AnalysisWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [board, setBoard] = useState<PositionBoard>(emptyBoard);
  const [orientation, setOrientation] = useState<BoardOrientation>("white");
  const [turn, setTurn] = useState<SideToMove>("w");
  const [castling, setCastling] = useState<CastlingRight[]>([]);
  const [enPassant, setEnPassant] = useState("-");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [depth, setDepth] = useState<AnalysisDepth>(14);
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [detection, setDetection] = useState<RecognitionResponse["detection"] | null>(null);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "found" | "not-found" | "error">("idle");
  const [scanMessage, setScanMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [finished, setFinished] = useState<FinishedResponse | null>(null);
  const [selectedLine, setSelectedLine] = useState<EngineLine | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [historySaved, setHistorySaved] = useState(false);
  const [fenInput, setFenInput] = useState("");
  const [fenMessage, setFenMessage] = useState("");
  const [showFenTools, setShowFenTools] = useState(false);
  const [previewMove, setPreviewMove] = useState(false);
  const [showPv, setShowPv] = useState(false);
  const [positionConfirmed, setPositionConfirmed] = useState(false);
  const [requiresVisualReview, setRequiresVisualReview] = useState(false);
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);
  const [confirmationError, setConfirmationError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDepth(readDepth());
      const params = new URLSearchParams(window.location.search);
      const savedFen = params.get("fen");
      const sampleId = params.get("sample");
      const sample = SAMPLE_POSITIONS.find((item) => item.id === sampleId);
      if (savedFen) loadFenPosition(savedFen, "Loaded saved position.");
      else if (sample) loadFenPosition(sample.fen, `Loaded sample: ${sample.title}`);
    }, 0);
    // The URL is read once; subsequent sample selection uses the buttons.
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!imageUrl) return;
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const currentFen = useMemo(() => {
    try {
      return boardToFen(board, turn, castling, enPassant.trim() || "-");
    } catch {
      return null;
    }
  }, [board, turn, castling, enPassant]);

  const validation = useMemo(() => currentFen ? validatePositionFen(currentFen) : null, [currentFen]);
  const markedSquares = useMemo(() => {
    if (!detection) return [];
    return detection.squareHints.filter((hint) => hint.likelyPiece).map((hint) => orientation === "white" ? hint.square : rotateSquare(hint.square));
  }, [detection, orientation]);
  const selectedAnalysisLine = selectedLine ?? (analysis ? {
    rank: 1,
    move: analysis.bestMove,
    uci: analysis.uci,
    piece: analysis.piece,
    from: analysis.from,
    to: analysis.to,
    evaluation: analysis.evaluation,
    score: analysis.score,
    depth: analysis.depth,
    principalVariation: analysis.principalVariation,
    pvUci: analysis.pvUci,
  } satisfies EngineLine : null);

  const boardForResult = useMemo(() => {
    if (!analysis || !selectedAnalysisLine) return null;
    if (!previewMove) return boardFromFen(analysis.fen);
    try {
      const game = new Chess(analysis.fen);
      game.move({ from: selectedAnalysisLine.from as Square, to: selectedAnalysisLine.to as Square, ...(selectedAnalysisLine.uci[4] ? { promotion: selectedAnalysisLine.uci[4] as PieceSymbol } : {}) });
      return boardFromFen(game.fen());
    } catch {
      return boardFromFen(analysis.fen);
    }
  }, [analysis, previewMove, selectedAnalysisLine]);

  function loadFenPosition(fen: string, message = "") {
    const result = validatePositionFen(fen);
    if (!result.ok) {
      setFenMessage(result.error);
      return false;
    }
    const parts = result.game.fen().split(" ");
    setBoard(boardFromFen(result.game.fen()));
    setTurn(parts[1] as SideToMove);
    setCastling(parts[2] === "-" ? [] : parts[2].split("") as CastlingRight[]);
    setEnPassant(parts[3]);
    setOrientation("white");
    setSelectedSquare(null);
    setDetection(null);
    setScanStatus("idle");
    setScanMessage("");
    setAnalysis(null);
    setFinished(null);
    setAnalysisError("");
    setPositionConfirmed(true);
    setRequiresVisualReview(false);
    setReviewAcknowledged(false);
    setConfirmationError("");
    setPreviewMove(false);
    setSelectedLine(null);
    setFenInput(fen);
    setFenMessage(message);
    return true;
  }

  function resetPosition() {
    setBoard(emptyBoard());
    setTurn("w");
    setCastling([]);
    setEnPassant("-");
    setSelectedSquare(null);
    setPositionConfirmed(false);
    setConfirmationError("");
    setAnalysis(null);
    setFinished(null);
    setAnalysisError("");
    setSelectedLine(null);
    setPreviewMove(false);
    setFenMessage("");
  }

  const inspectFile = useCallback(async (selected: File) => {
    if (!selected.type.startsWith("image/")) {
      setScanStatus("error");
      setScanMessage("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setScanStatus("error");
      setScanMessage("This image is over the 10 MB upload limit.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setScanStatus("error");
      setScanMessage("HEIC isn’t accepted by the web API yet. Export or share the screenshot as JPEG, PNG, or WebP.");
      return;
    }
    const nextUrl = URL.createObjectURL(selected);
    setImageUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return nextUrl;
    });
    setFile(selected);
    setRequiresVisualReview(true);
    setReviewAcknowledged(false);
    setDetection(null);
    setScanStatus("scanning");
    setScanMessage("Finding the board outline…");
    setAnalysis(null);
    setFinished(null);
    setAnalysisError("");
    setPositionConfirmed(false);
    setFenMessage("");
    setBoard(emptyBoard());
    setTurn("w");
    setCastling([]);
    setEnPassant("-");
    setOrientation("white");
    setSelectedSquare(null);

    const form = new FormData();
    form.append("image", selected, selected.name || "chess-screenshot.png");
    form.append("depth", String(depth));
    try {
      const response = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await response.json() as RecognitionResponse;
      if (!response.ok || data.status !== "needs_review" || !data.detection) {
        setScanStatus("not-found");
        setScanMessage(errorMessage(response, data));
        return;
      }
      setDetection(data.detection);
      setScanStatus("found");
      const hintCount = data.detection.squareHints.filter((hint) => hint.likelyPiece).length;
      setScanMessage(`Board outline found (${Math.round(data.detection.confidence * 100)}% detection confidence). ${hintCount} square${hintCount === 1 ? "" : "s"} have piece-like visual activity; confirm them against the screenshot.`);
    } catch {
      setScanStatus("error");
      setScanMessage("Could not reach the recognition endpoint. The image stays in this tab; you can still build the position manually.");
    }
  }, [depth]);

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (selected) void inspectFile(selected);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const selected = event.dataTransfer.files?.[0];
    if (selected) void inspectFile(selected);
  }

  function updateSquare(square: string, value: SquareValue) {
    const fileIndex = square.charCodeAt(0) - 97;
    const rankIndex = 8 - Number(square[1]);
    setBoard((current) => current.map((row, rowIndex) => row.map((cell, colIndex) => rowIndex === rankIndex && colIndex === fileIndex ? value : cell)));
    setPositionConfirmed(false);
    setReviewAcknowledged(false);
    setConfirmationError("");
    setAnalysis(null);
    setFinished(null);
    setSelectedLine(null);
  }

  function handleOrientation(next: BoardOrientation) {
    setOrientation(next);
    setPositionConfirmed(false);
    setReviewAcknowledged(false);
    setConfirmationError("");
  }

  function toggleCastling(right: CastlingRight) {
    setCastling((current) => current.includes(right) ? current.filter((item) => item !== right) : [...current, right]);
    setPositionConfirmed(false);
    setReviewAcknowledged(false);
  }

  function confirmPosition() {
    if (requiresVisualReview && !reviewAcknowledged) {
      setConfirmationError("Compare the position and game-state fields with the screenshot, then confirm that review.");
      setPositionConfirmed(false);
      return;
    }
    if (!currentFen) {
      setConfirmationError("Resolve every ? square as a piece or empty before continuing.");
      return;
    }
    const result = validatePositionFen(currentFen);
    if (!result.ok) {
      setConfirmationError(result.error);
      setPositionConfirmed(false);
      return;
    }
    setPositionConfirmed(true);
    setConfirmationError("");
  }

  async function analyzePosition() {
    if (!currentFen) {
      setAnalysisError("Resolve every uncertain square first.");
      return;
    }
    const result = validatePositionFen(currentFen);
    if (!result.ok) {
      setAnalysisError(result.error);
      return;
    }
    if (requiresVisualReview && !reviewAcknowledged) {
      setAnalysisError("Review the screenshot and acknowledge the position before analysis.");
      return;
    }
    if (!positionConfirmed) {
      setAnalysisError("Confirm that you reviewed the position against the screenshot first.");
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysis(null);
    setFinished(null);
    setSelectedLine(null);
    setPreviewMove(false);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fen: currentFen, depth }),
      });
      const data = await response.json() as AnalysisResult | FinishedResponse | ApiError;
      if (!response.ok || data.success === false) {
        setAnalysisError(errorMessage(response, data as ApiError));
        return;
      }
      if (data.status === "finished" && data.success === true) {
        setFinished(data as FinishedResponse);
        return;
      }
      const analysisResult = data as AnalysisResult;
      setAnalysis(analysisResult);
      setHistorySaved(saveAnalysisToHistory(analysisResult));
    } catch {
      setAnalysisError("Connection to the Stockfish service failed. Check your connection and retry.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function importFen() {
    if (!fenInput.trim()) {
      setFenMessage("Paste a full FEN with all six fields.");
      return;
    }
    loadFenPosition(fenInput.trim());
  }

  async function copyFen() {
    if (!currentFen) return;
    try {
      await navigator.clipboard.writeText(currentFen);
      setFenMessage("FEN copied to clipboard.");
    } catch {
      setFenMessage("Clipboard access is unavailable in this browser.");
    }
  }

  function chooseSample(id: string) {
    const sample = SAMPLE_POSITIONS.find((item) => item.id === id);
    if (sample) loadFenPosition(sample.fen, `Loaded sample: ${sample.title}`);
  }

  const unknownCount = board.flat().filter((square) => square === "?").length;
  const pieceCount = board.flat().filter((square) => square && square !== "?").length;
  const boardMove = selectedAnalysisLine ? { from: selectedAnalysisLine.from, to: selectedAnalysisLine.to } : null;

  return (
    <main id="main-content" className="workspace-page page-width">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow"><span /> POSITION WORKSPACE</p>
          <h1>Build the position.<br /><em>Then let it calculate.</em></h1>
          <p className="workspace-subtitle">Image recognition locates the board frame. You review every piece and game-state detail before Stockfish returns a move.</p>
        </div>
        <div className="workspace-heading-badges"><span className="engine-chip"><span className="live-indicator" /> Stockfish 19 Lite</span><span className="privacy-chip"><ShieldCheck size={13} /> No image retention</span></div>
      </div>

      <div className="workspace-grid">
        <section className="input-column" aria-label="Position input">
          <article className="panel upload-panel">
            <div className="panel-heading"><span className="panel-step">01</span><div><h2>Start with a screenshot</h2><p>JPEG, PNG or WebP · up to 10 MB</p></div><FileImage size={18} className="panel-heading-icon" /></div>
            <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileInput} aria-label="Choose a chess screenshot" />
            <div
              className={`upload-dropzone${isDragging ? " is-dragging" : ""}`}
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="upload-icon"><Upload size={20} /></div>
              <strong>Drop a board screenshot here</strong>
              <span>or choose an image from your device</span>
              <button type="button" className="button button-outline button-small" onClick={() => fileInputRef.current?.click()}>Choose screenshot</button>
            </div>
            <div className="upload-or"><span /> OR TRY A KNOWN POSITION <span /></div>
            <div className="sample-select-wrap">
              <label htmlFor="sample-position">Load a sample</label>
              <div className="select-with-icon"><select id="sample-position" defaultValue="" onChange={(event) => { if (event.target.value) chooseSample(event.target.value); event.target.value = ""; }}><option value="" disabled>Select a sample position…</option>{SAMPLE_POSITIONS.map((sample) => <option value={sample.id} key={sample.id}>{sample.title}</option>)}</select><ChevronDown size={15} /></div>
            </div>
            {scanStatus === "scanning" && <div className="inline-status status-working"><LoaderCircle size={15} className="spin" /> {scanMessage}</div>}
            {(scanStatus === "found" || scanStatus === "not-found" || scanStatus === "error") && <div className={`inline-status ${scanStatus === "found" ? "status-success" : "status-warning"}`} role="status">{scanStatus === "found" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}<span>{scanMessage}</span></div>}
            {imageUrl && file && (
              <div className="screenshot-card">
                <div className="screenshot-card-head"><span><FileImage size={14} /> {file.name}</span><button type="button" aria-label="Remove screenshot" className="icon-button compact" onClick={() => { setFile(null); setImageUrl(null); setDetection(null); setScanStatus("idle"); setScanMessage(""); setRequiresVisualReview(false); setReviewAcknowledged(false); }}><X size={15} /></button></div>
                <div className="screenshot-preview"><img src={imageUrl} alt="Uploaded chess screenshot" />{detection && <div className="board-detection-outline" style={{ left: `${detection.bounds.x * 100}%`, top: `${detection.bounds.y * 100}%`, width: `${detection.bounds.width * 100}%`, height: `${detection.bounds.height * 100}%` }}><span>BOARD FRAME</span></div>}</div>
                {detection && <p className="screenshot-caption"><ScanLine size={13} /> Board frame detected · not a piece classifier</p>}
              </div>
            )}
            <div className="privacy-callout"><ShieldCheck size={15} /><span>Image bytes are processed in memory and discarded. The server does not save this screenshot.</span></div>
          </article>

          <article className="panel position-panel">
            <div className="panel-heading"><span className="panel-step">02</span><div><h2>Review the board</h2><p>Correct every square before analysis</p></div><span className="panel-count">{pieceCount} pieces</span></div>
            <div className="review-warning"><Info size={15} /><p><strong>Important:</strong> this build finds the board outline and visual activity, but does not identify piece types or colours across arbitrary themes. Yellow dots are visual hints only. No piece is guessed into your FEN.</p></div>
            <div className="orientation-row"><span>Viewpoint</span><div className="segmented-control" role="group" aria-label="Board orientation"><button type="button" className={orientation === "white" ? "selected" : ""} onClick={() => handleOrientation("white")}>White bottom</button><button type="button" className={orientation === "black" ? "selected" : ""} onClick={() => handleOrientation("black")}>Black bottom</button></div></div>
            <ChessBoard board={board} orientation={orientation} selectedSquare={selectedSquare} markedSquares={markedSquares} onSquareClick={setSelectedSquare} label="Editable chess position" />
            <div className="board-helper-row"><span>{unknownCount ? <><AlertCircle size={13} /> {unknownCount} uncertain squares</> : <><CircleDot size={13} /> Tap any square to place or clear a piece</>}</span><button type="button" className="text-button" onClick={resetPosition}><RotateCcw size={13} /> Clear board</button></div>
            {selectedSquare && <div className="piece-picker" aria-label={`Choose piece for ${selectedSquare}`}><div className="piece-picker-head"><span>Set <strong>{selectedSquare}</strong></span><button type="button" className="icon-button compact" aria-label="Close piece picker" onClick={() => setSelectedSquare(null)}><X size={15} /></button></div><div className="piece-picker-row"><button type="button" className="piece-option piece-empty" onClick={() => { updateSquare(selectedSquare, null); setSelectedSquare(null); }}>Empty</button>{PIECE_OPTIONS.slice(0, 6).map((piece) => <button type="button" className="piece-option" key={piece.code} title={piece.label} aria-label={piece.label} onClick={() => { updateSquare(selectedSquare, piece.code); setSelectedSquare(null); }}><span className={piece.code === piece.code.toUpperCase() ? "piece-white" : "piece-black"}>{piece.glyph}</span></button>)}</div><div className="piece-picker-row">{PIECE_OPTIONS.slice(6).map((piece) => <button type="button" className="piece-option" key={piece.code} title={piece.label} aria-label={piece.label} onClick={() => { updateSquare(selectedSquare, piece.code); setSelectedSquare(null); }}><span className="piece-black">{piece.glyph}</span></button>)}<button type="button" className="piece-option piece-unknown" title="Mark uncertain" aria-label="Mark this square uncertain" onClick={() => { updateSquare(selectedSquare, "?"); setSelectedSquare(null); }}>?</button></div></div>}

            <div className="game-state-fields">
              <label className="field-label" htmlFor="turn-select">Side to move</label>
              <div className="select-with-icon"><select id="turn-select" value={turn} onChange={(event) => { setTurn(event.target.value as SideToMove); setPositionConfirmed(false); setReviewAcknowledged(false); }}><option value="w">White to move</option><option value="b">Black to move</option></select><ChevronDown size={15} /></div>
              <div className="field-label field-label-row"><span>Castling rights</span><span className="field-hint">Not visible in a screenshot</span></div>
              <div className="castling-grid">{CASTLING_OPTIONS.map((right) => <label key={right.key} className={castling.includes(right.key) ? "castling-option checked" : "castling-option"}><input type="checkbox" checked={castling.includes(right.key)} onChange={() => toggleCastling(right.key)} /><span className="checkmark">{castling.includes(right.key) && <Check size={11} />}</span>{right.label}</label>)}</div>
              <label className="field-label" htmlFor="en-passant">En-passant target <span className="field-hint">usually “-”</span></label>
              <input id="en-passant" className="text-input short-input" type="text" inputMode="text" autoCapitalize="none" autoCorrect="off" maxLength={2} pattern="(?:-|[a-h][36])" value={enPassant} onChange={(event) => { setEnPassant(event.target.value.toLowerCase()); setPositionConfirmed(false); setReviewAcknowledged(false); }} aria-describedby="ep-hint" />
              <span className="visually-hidden" id="ep-hint">Enter a dash or the en-passant target square from FEN.</span>
            </div>

            {requiresVisualReview && <label className="position-review-ack"><input type="checkbox" checked={reviewAcknowledged} onChange={(event) => { setReviewAcknowledged(event.target.checked); setPositionConfirmed(false); setConfirmationError(""); }} /><span><strong>I reviewed this position against the screenshot.</strong> I checked the pieces, side to move, castling rights, and en-passant state.</span></label>}
            <div className="position-validation" role="status">
              {confirmationError ? <><AlertCircle size={15} /><span>{confirmationError}</span></> : requiresVisualReview && !reviewAcknowledged ? <><Info size={15} /><span>Compare the board and game-state fields with the screenshot, then acknowledge your review.</span></> : positionConfirmed && validation?.ok ? <><CheckCircle2 size={15} /><span>Position is legal and reviewed. Ready for Stockfish.</span></> : validation?.ok ? <><Info size={15} /><span>Legal position. Compare it against the screenshot, then confirm.</span></> : <><AlertCircle size={15} /><span>{validation && !validation.ok ? validation.error : "Set the pieces and game state to validate this position."}</span></>}
            </div>
            <div className="position-action-row"><button type="button" className="button button-outline" onClick={confirmPosition} disabled={!validation?.ok || (requiresVisualReview && !reviewAcknowledged)}><CheckCircle2 size={15} /> Confirm position</button><button type="button" className="text-button" onClick={() => setShowFenTools((value) => !value)}><Clipboard size={14} /> FEN tools {showFenTools ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button></div>
            {showFenTools && <div className="fen-tools"><label htmlFor="fen-input" className="field-label">Paste a full six-field FEN</label><textarea id="fen-input" className="fen-textarea" rows={3} value={fenInput} onChange={(event) => setFenInput(event.target.value)} placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" spellCheck={false} /><div className="fen-tool-actions"><button type="button" className="button button-outline button-small" onClick={importFen}>Load FEN</button><button type="button" className="text-button" onClick={() => void copyFen()} disabled={!currentFen}><Clipboard size={13} /> Copy current FEN</button></div>{fenMessage && <span className="fen-feedback" role="status">{fenMessage}</span>}</div>}
            <div className="fen-current"><span className="tiny-label">CURRENT FEN</span><code>{currentFen ?? "Position contains an unconfirmed square"}</code></div>
          </article>
        </section>

        <aside className="results-column" aria-label="Stockfish analysis">
          <article className="panel engine-panel">
            <div className="panel-heading"><span className="panel-step">03</span><div><h2>Engine analysis</h2><p>Real Stockfish 19 Lite · MultiPV</p></div><span className="engine-pulse"><span className="live-indicator" /> READY</span></div>
            <div className="strength-select"><label htmlFor="strength">Analysis depth</label><div className="select-with-icon"><select id="strength" value={depth} onChange={(event) => { const next = Number(event.target.value) as AnalysisDepth; setDepth(next); writeDepth(next); }}><option value={10}>Quick · depth 10</option><option value={14}>Balanced · depth 14</option><option value={18}>Deep · depth 18</option></select><ChevronDown size={15} /></div></div>
            <button type="button" className="button button-primary analyze-button" onClick={() => void analyzePosition()} disabled={!positionConfirmed || isAnalyzing}><Sparkles size={17} />{isAnalyzing ? "Stockfish is thinking…" : "Analyze position"}<ArrowRight size={16} /></button>
            {isAnalyzing && <div className="engine-thinking" role="status"><span className="thinking-bars"><i /><i /><i /><i /></span><span>Searching legal continuations to depth {depth}. This can take a few seconds.</span></div>}
            {analysisError && <div className="analysis-error" role="alert"><AlertCircle size={15} /><span>{analysisError}</span></div>}
            {finished && <div className="finished-state" role="status"><span className="finished-icon"><CheckCircle2 size={18} /></span><strong>{finished.result === "checkmate" ? "Already checkmate" : finished.result === "stalemate" ? "Stalemate" : "Drawn position"}</strong><p>{finished.message}</p></div>}
            {!analysis && !finished && !isAnalyzing && <div className="analysis-empty"><span className="empty-spark"><Sparkles size={18} /></span><h3>Your move report appears here.</h3><p>Load a sample or finish reviewing the board. The engine button unlocks when the position is legal and confirmed.</p><div className="empty-checklist"><span><Check size={12} /> Legal FEN validation</span><span><Check size={12} /> Best move + 3 lines</span><span><Check size={12} /> Real engine score</span></div></div>}
          </article>

          {analysis && selectedAnalysisLine && boardForResult && <div className="result-stack">
            <article className="panel best-move-panel">
              <div className="best-move-topline"><span className="best-label"><Flame size={14} /> BEST MOVE</span><span className="depth-badge">DEPTH {analysis.depth}</span></div>
              <div className="best-move-main"><div><span className="move-san">{analysis.bestMove}</span><span className="move-description">{analysis.piece} · {analysis.from} → {analysis.to}</span></div><div className="eval-badge"><span className="tiny-label">WHITE EVAL</span><strong>{analysis.evaluation}</strong></div></div>
              <div className="result-board-wrap"><ChessBoard board={boardForResult} orientation={orientation} move={boardMove} label={previewMove ? "Board after recommended move" : "Position with recommended move highlighted"} /></div>
              <div className="result-controls"><button type="button" className={previewMove ? "text-button preview-active" : "text-button"} onClick={() => setPreviewMove((value) => !value)}>{previewMove ? <RotateCcw size={14} /> : <ArrowDown size={14} />}{previewMove ? "Show original position" : `Preview ${selectedAnalysisLine.move}`}</button><span>{previewMove ? "Move applied on board" : "Arrow marks the engine move"}</span></div>
              <div className="why-move"><span className="why-icon"><Sparkles size={14} /></span><div><span className="tiny-label">WHY THIS MOVE</span><p>{analysis.explanation}</p></div></div>
              <div className="move-meta"><span><span className="tiny-label">UCI</span><code>{selectedAnalysisLine.uci}</code></span><span><span className="tiny-label">ENGINE</span><code>{analysis.engine}</code></span><span><span className="tiny-label">SAVED</span><code>{historySaved ? "On this device" : "History unavailable"}</code></span></div>
            </article>

            <article className="panel alternatives-panel">
              <div className="panel-heading panel-heading-tight"><div><h2>Other engine lines</h2><p>Ranked at the same search depth</p></div><span className="line-count">{analysis.alternatives.length + 1} lines</span></div>
              <div className="alternative-list">
                <button type="button" className={selectedLine === null ? "alternative-row selected" : "alternative-row"} onClick={() => { setSelectedLine(null); setPreviewMove(false); }}><span className="alternative-rank">01</span><strong>{analysis.bestMove}</strong><span className="alternative-uci">{analysis.uci}</span><span className="alternative-eval">{analysis.evaluation}</span>{selectedLine === null && <Check size={14} />}</button>
                {analysis.alternatives.map((line, index) => <button type="button" className={selectedLine?.uci === line.uci ? "alternative-row selected" : "alternative-row"} key={line.uci} onClick={() => { setSelectedLine(line); setPreviewMove(false); }}><span className="alternative-rank">{String(index + 2).padStart(2, "0")}</span><strong>{line.move}</strong><span className="alternative-uci">{line.uci}</span><span className="alternative-eval">{line.evaluation}</span>{selectedLine?.uci === line.uci && <Check size={14} />}</button>)}
              </div>
              {analysis.alternatives.length === 0 && <p className="one-line-note">Stockfish found no other legal continuations in this position.</p>}
              <button className="pv-toggle" type="button" onClick={() => setShowPv((value) => !value)} aria-expanded={showPv}>{showPv ? "Hide" : "Show"} principal variation {showPv ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button>
              {showPv && <div className="pv-content"><span className="tiny-label">{selectedAnalysisLine.move} · DEPTH {selectedAnalysisLine.depth}</span><p>{selectedAnalysisLine.principalVariation.join("  ·  ") || selectedAnalysisLine.move}</p><code>{selectedAnalysisLine.pvUci.join(" ")}</code></div>}
              <p className="result-footnote"><Info size={13} /> Evaluations are from White’s perspective. Stockfish Lite is a strong analysis engine, not a guarantee of a forced win.</p>
            </article>
          </div>}

          <div className="sidebar-note"><ShieldCheck size={15} /><p>Only the confirmed FEN is sent to the engine. Images aren’t stored, and history stays in this browser.</p></div>
        </aside>
      </div>
      <div className="workspace-mobile-links"><Link href="/history">View analysis history <ArrowRight size={14} /></Link><Link href="/shortcuts">Set up iPhone Shortcuts <ArrowRight size={14} /></Link></div>
    </main>
  );
}
