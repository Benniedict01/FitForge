import { Chess } from "chess.js";
import type { BoardOrientation, SideToMove } from "@/lib/chess/position";

export type ChessImageBounds = { x0: number; y0: number; x1: number; y1: number };
export type RgbImage = { data: Uint8Array; width: number; height: number; channels: number };
export type TurnInference = { turn: SideToMove; confidence: number; source: string; detail: string };
export type OcrWord = { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } };
export type OcrLine = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  words?: OcrWord[];
};
export type LastMoveEvidence = {
  from: string;
  to: string;
  piece: string;
  turn: SideToMove;
  enPassant: string;
  confidence: number;
};

const FILES = "abcdefgh";
const START_PLACEMENT = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

function placementRows(placement: string): string[][] | null {
  const ranks = placement.split("/");
  if (ranks.length !== 8) return null;
  const rows: string[][] = [];
  for (const rank of ranks) {
    const row: string[] = [];
    for (const char of rank) {
      if (/^[1-8]$/.test(char)) row.push(...Array(Number(char)).fill("1"));
      else if (/^[prnbqkPRNBQK]$/.test(char)) row.push(char);
      else return null;
    }
    if (row.length !== 8) return null;
    rows.push(row);
  }
  return rows;
}

export function orientationEvidence(placement: string): {
  orientation: BoardOrientation | null;
  confidence: number;
  pawnSignal: number | null;
} {
  const rows = placementRows(placement);
  if (!rows) return { orientation: null, confidence: 0, pawnSignal: null };
  const whiteRanks: number[] = [];
  const blackRanks: number[] = [];
  rows.forEach((row, rowIndex) => {
    const rank = 8 - rowIndex;
    for (const piece of row) {
      if (piece === "P") whiteRanks.push(rank);
      else if (piece === "p") blackRanks.push(rank);
    }
  });
  if (whiteRanks.length === 0 || blackRanks.length === 0) {
    return { orientation: null, confidence: 0, pawnSignal: null };
  }
  const mean = (values: number[]) => values.reduce((sum, rank) => sum + rank, 0) / values.length;
  const pawnSignal = mean(blackRanks) - mean(whiteRanks);
  const magnitude = Math.abs(pawnSignal);
  if (magnitude < 0.75) return { orientation: null, confidence: 0.5, pawnSignal };
  return {
    orientation: pawnSignal > 0 ? "white" : "black",
    confidence: Math.min(0.99, 0.72 + magnitude * 0.05),
    pawnSignal,
  };
}

export function inferTurnFromPosition(placement: string): TurnInference | null {
  if (placement === START_PLACEMENT) {
    return { turn: "w", confidence: 0.98, source: "starting position", detail: "The recognized board matches the standard initial position." };
  }
  try {
    const whiteToMove = new Chess(`${placement} w - - 0 1`).isCheck();
    const blackToMove = new Chess(`${placement} b - - 0 1`).isCheck();
    if (whiteToMove !== blackToMove) {
      const turn: SideToMove = whiteToMove ? "w" : "b";
      return {
        turn,
        confidence: 0.96,
        source: "check status",
        detail: `${turn === "w" ? "White" : "Black"} is the only side currently in check.`,
      };
    }
  } catch {
    // The later FEN validator reports malformed or impossible positions.
  }
  return null;
}

function median(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function medianColor(colors: number[][]): [number, number, number] {
  return [0, 1, 2].map((channel) => median(colors.map((color) => color[channel]))) as [number, number, number];
}

function samplePatch(image: RgbImage, centerX: number, centerY: number, radius: number): [number, number, number] | null {
  const sum = [0, 0, 0];
  let count = 0;
  const cx = Math.round(centerX);
  const cy = Math.round(centerY);
  for (let y = cy - radius; y <= cy + radius; y += 1) {
    for (let x = cx - radius; x <= cx + radius; x += 1) {
      if (x < 0 || y < 0 || x >= image.width || y >= image.height) continue;
      const offset = (y * image.width + x) * image.channels;
      sum[0] += image.data[offset];
      sum[1] += image.data[offset + 1];
      sum[2] += image.data[offset + 2];
      count += 1;
    }
  }
  return count ? [sum[0] / count, sum[1] / count, sum[2] / count] : null;
}

function imageSquareToFenSquare(row: number, col: number, orientation: BoardOrientation): string {
  const file = orientation === "white" ? col : 7 - col;
  const rank = orientation === "white" ? 8 - row : row + 1;
  return `${FILES[file]}${rank}`;
}

function placementPieceAtImageSquare(rows: string[][], row: number, col: number): string {
  return rows[row][col];
}

/**
 * Finds the two same-style square highlights used for a last move. This is deliberately
 * conservative: it only reports a move when two board squares share a strong colour
 * shift and the recognized position has exactly one occupied destination and one empty
 * source. A single selected square, arrow, or visually active square is not enough.
 */
export function inferLastMoveFromHighlights(
  image: RgbImage,
  bounds: ChessImageBounds,
  rawPlacement: string,
  orientation: BoardOrientation | null,
  squareConfidences: number[],
): LastMoveEvidence | null {
  const rows = placementRows(rawPlacement);
  if (!rows || image.channels < 3 || squareConfidences.length !== 64) return null;
  const width = (bounds.x1 - bounds.x0) / 8;
  const height = (bounds.y1 - bounds.y0) / 8;
  if (!(width >= 5 && height >= 5)) return null;
  const patchRadius = Math.max(0, Math.min(2, Math.floor(Math.min(width, height) / 36)));
  const samples: Array<{ row: number; col: number; color: [number, number, number] }> = [];

  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const colors: number[][] = [];
      for (const [fx, fy] of [[0.19, 0.19], [0.81, 0.19], [0.19, 0.81], [0.81, 0.81]]) {
        const color = samplePatch(image, bounds.x0 + (col + fx) * width, bounds.y0 + (row + fy) * height, patchRadius);
        if (color) colors.push(color);
      }
      if (colors.length) samples.push({ row, col, color: medianColor(colors) });
    }
  }
  if (samples.length !== 64) return null;

  const baselines = new Map<number, [number, number, number]>();
  for (const parity of [0, 1]) {
    const cells = samples.filter(({ row, col }) => (row + col) % 2 === parity).map(({ color }) => color);
    baselines.set(parity, medianColor(cells));
  }
  const shiftScores: number[] = [];
  const candidates = samples.map(({ row, col, color }) => {
    const baseline = baselines.get((row + col) % 2)!;
    const delta = color.map((channel, index) => channel - baseline[index]) as [number, number, number];
    const yellowShift = (delta[0] + delta[1] - 2 * delta[2]) / 2;
    const magnitude = Math.hypot(...delta);
    shiftScores.push(yellowShift);
    const confidenceIndex = (7 - row) * 8 + col; // Fenshot probabilities are A1..H8.
    return { row, col, delta, yellowShift, magnitude, piece: placementPieceAtImageSquare(rows, row, col), tileConfidence: squareConfidences[confidenceIndex] };
  });
  const center = median(shiftScores);
  const mad = median(shiftScores.map((score) => Math.abs(score - center)));
  const threshold = Math.max(22, center + 4 * Math.max(2, mad));
  const highlighted = candidates.filter((cell) => cell.yellowShift >= threshold && cell.magnitude >= 24);
  if (highlighted.length < 2 || highlighted.length > 10) return null;

  const pairs: Array<{ from: typeof highlighted[number]; to: typeof highlighted[number]; score: number }> = [];
  for (let i = 0; i < highlighted.length; i += 1) {
    for (let j = i + 1; j < highlighted.length; j += 1) {
      const a = highlighted[i];
      const b = highlighted[j];
      const aEmpty = a.piece === "1";
      const bEmpty = b.piece === "1";
      if (aEmpty === bEmpty || a.tileConfidence < 0.7 || b.tileConfidence < 0.7) continue;
      const from = aEmpty ? a : b;
      const to = aEmpty ? b : a;
      const dot = from.delta.reduce((sum, value, index) => sum + value * to.delta[index], 0);
      const norm = from.magnitude * to.magnitude;
      const similarity = norm ? dot / norm : -1;
      if (similarity < 0.55) continue;
      const score = similarity * 100 + Math.min(from.yellowShift, to.yellowShift) - Math.abs(from.yellowShift - to.yellowShift) * 0.25;
      pairs.push({ from, to, score });
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  if (!pairs.length || (pairs.length > 1 && pairs[0].score - pairs[1].score < 8)) return null;

  const { from, to } = pairs[0];
  const piece = to.piece;
  if (!/^[prnbqkPRNBQK]$/.test(piece)) return null;
  const turn: SideToMove = piece === piece.toUpperCase() ? "b" : "w";
  let enPassant = "-";
  if (orientation && piece.toLowerCase() === "p") {
    const fromSquare = imageSquareToFenSquare(from.row, from.col, orientation);
    const toSquare = imageSquareToFenSquare(to.row, to.col, orientation);
    const fromRank = Number(fromSquare[1]);
    const toRank = Number(toSquare[1]);
    if (piece === "P" && fromRank === 2 && toRank === 4) enPassant = `${toSquare[0]}3`;
    if (piece === "p" && fromRank === 7 && toRank === 5) enPassant = `${toSquare[0]}6`;
  }
  const confidence = Math.min(0.94, 0.82 + Math.min(from.yellowShift, to.yellowShift) / 350);
  return {
    from: orientation ? imageSquareToFenSquare(from.row, from.col, orientation) : `${FILES[from.col]}${8 - from.row}`,
    to: orientation ? imageSquareToFenSquare(to.row, to.col, orientation) : `${FILES[to.col]}${8 - to.row}`,
    piece,
    turn,
    enPassant,
    confidence,
  };
}

function canonicalSan(value: string): string {
  return value
    .replace(/[!?+#]+$/g, "")
    .replace(/[0Ο]/g, "O")
    .toLowerCase()
    .replace(/[^a-z0-9=/-]/g, "");
}

function legalSanMatches(tail: string, placement: string, castling: string, enPassant: string, turn: SideToMove): boolean {
  try {
    const game = new Chess(`${placement} ${turn} ${castling || "-"} ${enPassant || "-"} 0 1`);
    const compactTail = canonicalSan(tail);
    if (!compactTail) return false;
    return game.moves().some((move) => {
      const san = canonicalSan(move);
      return san.length >= 2 && compactTail.startsWith(san);
    });
  } catch {
    return false;
  }
}

function explicitTurn(text: string): SideToMove | null {
  const normalized = text.replace(/[’']/g, "'");
  const white = /\bwhite\s+(?:to\s+move|to\s+play|moves\s+next|plays\s+next)\b|\bwhite'?s\s+turn\b/i.test(normalized);
  const black = /\bblack\s+(?:to\s+move|to\s+play|moves\s+next|plays\s+next)\b|\bblack'?s\s+turn\b/i.test(normalized);
  if (white === black) return null;
  return white ? "w" : "b";
}

/** Uses an explicit turn label or legal root moves shown in a Chess.com engine panel. */
export function inferTurnFromOcr(
  lines: OcrLine[],
  boardBounds: ChessImageBounds,
  placement: string,
  castling: string,
  enPassant: string,
): TurnInference | null {
  const allText = lines.map((line) => line.text).join("\n");
  const explicit = explicitTurn(allText);
  if (explicit) {
    return { turn: explicit, confidence: 0.96, source: "screenshot text", detail: `OCR found an explicit ${explicit === "w" ? "White" : "Black"}-to-move label.` };
  }

  const rightSideLines = lines.flatMap((line) => {
    const words = line.words?.filter((word) => word.bbox.x1 > boardBounds.x1 + 4) ?? [];
    if (!words.length) return [];
    const text = words.map((word) => word.text).join(" ").trim();
    const confidence = words.reduce((sum, word) => sum + word.confidence, 0) / words.length;
    return [{ text, confidence, y: line.bbox.y0 }];
  });
  const sidePanelText = rightSideLines.map((line) => line.text).join(" ");
  const enginePanel = /stockfish/i.test(sidePanelText) && (/analysis/i.test(sidePanelText) || /depth\s*[=:]?\s*\d+/i.test(sidePanelText));
  if (!enginePanel) return null;

  const votes: SideToMove[] = [];
  for (const line of rightSideLines) {
    if (line.confidence < 42) continue;
    const prefix = /(?:^|\s)(\d{1,3})\s*(\.{1,3}|…{1,3})\s*/.exec(line.text);
    if (!prefix) continue;
    const punctuation = prefix[2].replace(/…/g, ".").length;
    const tail = line.text.slice(prefix.index + prefix[0].length).trim();
    const whiteLegal = legalSanMatches(tail, placement, castling, enPassant, "w");
    const blackLegal = legalSanMatches(tail, placement, castling, enPassant, "b");
    if (whiteLegal !== blackLegal) votes.push(whiteLegal ? "w" : "b");
    else if (whiteLegal && punctuation >= 3) votes.push("b");
    else if (blackLegal && punctuation === 1) votes.push("w");
  }
  if (!votes.length) return null;
  const whiteVotes = votes.filter((vote) => vote === "w").length;
  const blackVotes = votes.length - whiteVotes;
  if (whiteVotes > 0 && blackVotes > 0) return null;
  const turn: SideToMove = whiteVotes > 0 ? "w" : "b";
  return {
    turn,
    confidence: votes.length >= 2 ? 0.94 : 0.87,
    source: "Chess.com engine variation",
    detail: `OCR found ${votes.length} legal root move${votes.length === 1 ? "" : "s"} for ${turn === "w" ? "White" : "Black"} in the visible engine panel.`,
  };
}

export function reconcileTurnEvidence(candidates: Array<TurnInference | null>): {
  inference: TurnInference | null;
  conflict: boolean;
} {
  const evidence = candidates.filter((candidate): candidate is TurnInference => candidate !== null);
  const sides = new Set(evidence.map((candidate) => candidate.turn));
  if (sides.size > 1) return { inference: null, conflict: true };
  if (!evidence.length) return { inference: null, conflict: false };
  return {
    inference: evidence.slice().sort((a, b) => b.confidence - a.confidence)[0],
    conflict: false,
  };
}

export function validateRecognizedPlacement(placement: string): string | null {
  const rows = placementRows(placement);
  if (!rows) return "The model did not return a complete 8×8 board.";
  let whiteKing = 0;
  let blackKing = 0;
  let whitePieces = 0;
  let blackPieces = 0;
  let whitePawns = 0;
  let blackPawns = 0;
  for (let rowIndex = 0; rowIndex < 8; rowIndex += 1) {
    for (const piece of rows[rowIndex]) {
      if (piece === "1") continue;
      if (piece === "K") whiteKing += 1;
      if (piece === "k") blackKing += 1;
      if (piece === piece.toUpperCase()) whitePieces += 1;
      else blackPieces += 1;
      if (piece === "P") whitePawns += 1;
      if (piece === "p") blackPawns += 1;
      if (piece === "P" && rowIndex === 0 || piece === "P" && rowIndex === 7 || piece === "p" && (rowIndex === 0 || rowIndex === 7)) {
        return "A recognized pawn is on the first or eighth rank, which is not a legal chess position.";
      }
    }
  }
  if (whiteKing !== 1 || blackKing !== 1) return "The position must contain exactly one king of each color.";
  if (whitePieces > 16 || blackPieces > 16 || whitePawns > 8 || blackPawns > 8) {
    return "The piece count is outside the legal chess limits; one or more squares may be misclassified.";
  }
  return null;
}
