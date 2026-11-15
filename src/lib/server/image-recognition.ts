import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  extractTiles,
  flipPlacement,
  inferCastling,
  probsToPlacement,
  recognizeGray,
  type BoardCorners,
  type GrayImage,
} from "@scoriiu/fenshot";
import { validatePositionFen, type BoardOrientation, type SideToMove } from "@/lib/chess/position";
import {
  inferLastMoveFromHighlights,
  inferTurnFromOcr,
  inferTurnFromPosition,
  orientationEvidence,
  reconcileTurnEvidence,
  validateRecognizedPlacement,
  type OcrLine,
  type RgbImage,
  type TurnInference,
} from "@/lib/chess/screenshot-state";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const MAX_PROCESSING_DIMENSION = 1600;
const CONFIDENCE_FLOOR = 0.7;
const require = createRequire(path.join(process.cwd(), "package.json"));

type OrtModule = typeof import("onnxruntime-web/wasm");
type InferenceSession = import("onnxruntime-web/wasm").InferenceSession;
type OrtSession = { ort: OrtModule; session: InferenceSession };
type OcrWorker = {
  recognize: (
    image: Buffer,
    options?: Record<string, unknown>,
    output?: { text?: boolean; blocks?: boolean },
  ) => Promise<{ data: { text: string; blocks: Array<{ paragraphs?: Array<{ lines?: OcrLine[] }> }> | null } }>;
  setParameters: (parameters: Record<string, string>) => Promise<unknown>;
};

type RecognitionWarning = { code: string; message: string };

export type ScreenshotRecognition = {
  model: "Fenshot chess-tiles-v2";
  placement: string;
  orientation: BoardOrientation | "unknown";
  orientationConfidence: number;
  turn: SideToMove | null;
  turnConfidence: number;
  turnSource: string | null;
  turnDetail: string | null;
  castling: string;
  enPassant: string;
  confidence: { mean: number; minimum: number; threshold: number };
  confidenceBySquare: Record<string, number>;
  bounds: { x: number; y: number; width: number; height: number };
  plausible: boolean;
  ready: boolean;
  warnings: RecognitionWarning[];
  fen: string | null;
};

export type ScreenshotInspection = {
  width: number;
  height: number;
  detection: { bounds: ScreenshotRecognition["bounds"] } | null;
  recognition: ScreenshotRecognition | null;
};

let sessionPromise: Promise<OrtSession> | null = null;
let ocrWorkerPromise: Promise<OcrWorker> | null = null;

export function imageSignatureMatches(buffer: Buffer, mime: string): boolean {
  if (mime === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }
  if (mime === "image/webp") {
    return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  }
  return false;
}

async function getModelSession(): Promise<OrtSession> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await import("onnxruntime-web/wasm");
      const runtimeEntry = require.resolve("onnxruntime-web/wasm");
      const wasmPath = path.join(path.dirname(runtimeEntry), "ort-wasm-simd-threaded.wasm");
      const modelPath = require.resolve("@scoriiu/fenshot/model/chess-tiles-v2.onnx");
      const [wasmBinary, modelBinary] = await Promise.all([readFile(wasmPath), readFile(modelPath)]);
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.wasmBinary = wasmBinary;
      const session = await ort.InferenceSession.create(
        new Uint8Array(modelBinary.buffer, modelBinary.byteOffset, modelBinary.byteLength),
        { executionProviders: ["wasm"] },
      );
      return { ort, session };
    })().catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }
  return sessionPromise;
}

async function getOcrWorker(): Promise<OcrWorker> {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const tesseract = require("tesseract.js") as {
        createWorker: (language: string, oem: number, options: Record<string, unknown>) => Promise<OcrWorker>;
        PSM: { AUTO: string };
      };
      const languagePackage = require.resolve("@tesseract.js-data/eng");
      const languagePath = path.join(path.dirname(languagePackage), "4.0.0_best_int");
      const worker = await tesseract.createWorker("eng", 1, {
        langPath: languagePath,
        gzip: true,
        cacheMethod: "none",
        logger: () => undefined,
      });
      await worker.setParameters({
        tessedit_pageseg_mode: tesseract.PSM.AUTO,
        preserve_interword_spaces: "1",
      });
      return worker;
    })().catch((error) => {
      ocrWorkerPromise = null;
      throw error;
    });
  }
  return ocrWorkerPromise;
}

function confidenceBySquare(confidences: number[], orientation: BoardOrientation | null): Record<string, number> {
  const output: Record<string, number> = {};
  for (let rank = 1; rank <= 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const canonicalIndex = (rank - 1) * 8 + file;
      const modelIndex = orientation === "black" ? 63 - canonicalIndex : canonicalIndex;
      output[`${String.fromCharCode(97 + file)}${rank}`] = confidences[modelIndex] ?? 0;
    }
  }
  return output;
}

function collectOcrLines(blocks: Array<{ paragraphs?: Array<{ lines?: OcrLine[] }> }> | null): OcrLine[] {
  if (!blocks) return [];
  return blocks.flatMap((block) => block.paragraphs?.flatMap((paragraph) => paragraph.lines ?? []) ?? []);
}

function rgbToGray(rgb: RgbImage): GrayImage {
  const data = new Float32Array(rgb.width * rgb.height);
  for (let index = 0; index < data.length; index += 1) {
    const offset = index * rgb.channels;
    data[index] = 0.299 * rgb.data[offset] + 0.587 * rgb.data[offset + 1] + 0.114 * rgb.data[offset + 2];
  }
  return { data, width: rgb.width, height: rgb.height };
}

async function classifyBoard(gray: GrayImage) {
  const { ort, session } = await getModelSession();
  return recognizeGray(gray, async (corners: BoardCorners) => {
    const tiles = extractTiles(gray, corners);
    const output = await session.run({ tiles: new ort.Tensor("float32", tiles, [64, 1024]) });
    const probabilities = output.probs?.data;
    if (!(probabilities instanceof Float32Array) || probabilities.length !== 64 * 13) {
      throw new Error("The vision model returned an unexpected 64-square output.");
    }
    return probsToPlacement(probabilities);
  });
}

function makeWarnings(input: {
  modelReliable: boolean;
  modelPlausible: boolean;
  orientation: BoardOrientation | null;
  turn: TurnInference | null;
  conflict: boolean;
  placementError: string | null;
  fenError: string | null;
  castling: string;
  enPassant: string;
  lastMove: boolean;
}): RecognitionWarning[] {
  const warnings: RecognitionWarning[] = [];
  if (!input.modelReliable) warnings.push({ code: "LOW_SQUARE_CONFIDENCE", message: "One or more square predictions are below the model's 0.70 confidence threshold." });
  if (!input.modelPlausible) warnings.push({ code: "KING_COUNT", message: "The prediction does not contain exactly one king of each color; it may not represent the chessboard." });
  if (input.orientation === null) {
    warnings.push({ code: "ORIENTATION_UNCERTAIN", message: "Board orientation could not be established from pawn direction." });
    warnings.push({ code: "CASTLING_UNCERTAIN", message: "Because board orientation is unknown, castling rights were omitted. Set them manually if you know the game history." });
  }
  if (input.conflict) warnings.push({ code: "CONFLICTING_TURN_EVIDENCE", message: "Visible game-state cues disagree about whose turn it is." });
  else if (!input.turn) warnings.push({ code: "TURN_UNAVAILABLE", message: "The screenshot does not provide a reliable side-to-move cue. A board image alone cannot encode this FEN field." });
  if (input.placementError) warnings.push({ code: "ILLEGAL_PIECE_LAYOUT", message: input.placementError });
  if (input.fenError) warnings.push({ code: "FEN_VALIDATION", message: input.fenError });
  if (input.orientation !== null && input.castling !== "-") warnings.push({ code: "CASTLING_INFERRED", message: "Castling rights are inferred from king/rook home squares; a still image cannot prove whether those pieces moved and returned." });
  if (input.lastMove) warnings.push({ code: "LAST_MOVE_INFERRED", message: "Last-move highlight detection is heuristic; verify the inferred turn and any en-passant target against the screenshot." });
  else warnings.push({ code: "HISTORY_UNAVAILABLE", message: "No last-move cue was available; en-passant is set to '-' and move counters use neutral defaults." });
  return warnings;
}

export async function inspectChessScreenshot(buffer: Buffer, mime: string): Promise<ScreenshotInspection> {
  if (!imageSignatureMatches(buffer, mime)) {
    throw new Error("Unsupported image or image type does not match its file contents. Use JPEG, PNG, or WebP.");
  }
  const normalizedPng = await sharp(buffer, { limitInputPixels: MAX_PIXELS, failOn: "error" })
    .rotate()
    .resize({ width: MAX_PROCESSING_DIMENSION, height: MAX_PROCESSING_DIMENSION, fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#fff" })
    .toColourspace("srgb")
    .png()
    .toBuffer();
  const decoded = await sharp(normalizedPng).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (decoded.info.channels < 3 || decoded.info.width < 64 || decoded.info.height < 64) {
    throw new Error("The image is too small to inspect. Use a screenshot with the full board visible.");
  }
  const rgb: RgbImage = {
    data: decoded.data,
    width: decoded.info.width,
    height: decoded.info.height,
    channels: decoded.info.channels,
  };
  const gray = rgbToGray(rgb);
  const width = rgb.width;
  const height = rgb.height;
  const board = await classifyBoard(gray);
  if (!board) return { width, height, detection: null, recognition: null };

  const placementError = validateRecognizedPlacement(board.placement);
  const orientationSignal = orientationEvidence(board.placement);
  const orientation = orientationSignal.orientation;
  const normalizedPlacement = orientation === "black" ? flipPlacement(board.placement) : board.placement;
  const castling = orientation === null ? "-" : inferCastling(normalizedPlacement);
  const rawBounds = board.corners;
  const bounds = {
    x: Math.max(0, Math.min(1, rawBounds.x0 / width)),
    y: Math.max(0, Math.min(1, rawBounds.y0 / height)),
    width: Math.max(0, Math.min(1, (rawBounds.x1 - rawBounds.x0) / width)),
    height: Math.max(0, Math.min(1, (rawBounds.y1 - rawBounds.y0) / height)),
  };
  const confidenceMap = confidenceBySquare(board.confidences, orientation);

  const positionTurn = orientation === null ? null : inferTurnFromPosition(normalizedPlacement);
  const lastMove = inferLastMoveFromHighlights(rgb, rawBounds, board.placement, orientation, board.confidences);
  let ocrTurn: TurnInference | null = null;
  if (orientation !== null && !positionTurn && !lastMove) {
    try {
      const worker = await getOcrWorker();
      const recognizedText = await worker.recognize(normalizedPng, {}, { text: true, blocks: true });
      const lines = collectOcrLines(recognizedText.data.blocks);
      ocrTurn = inferTurnFromOcr(lines, rawBounds, normalizedPlacement, castling, "-");
    } catch {
      // OCR is optional evidence; recognition still returns its piece and board confidence.
    }
  }
  const turnEvidence = reconcileTurnEvidence([
    positionTurn,
    lastMove ? {
      turn: lastMove.turn,
      confidence: lastMove.confidence,
      source: "last-move highlight",
      detail: `The highlighted move ends on ${lastMove.to} with a recognized ${lastMove.piece === lastMove.piece.toUpperCase() ? "White" : "Black"} piece.`,
    } : null,
    ocrTurn,
  ]);
  const turn = turnEvidence.inference;
  const enPassant = lastMove?.enPassant ?? "-";
  const modelReliable = board.reliable && board.minConfidence >= CONFIDENCE_FLOOR;
  const plausible = board.plausible && placementError === null;
  let fen: string | null = null;
  let fenError: string | null = null;
  if (turn && plausible && orientation) {
    const candidateFen = `${normalizedPlacement} ${turn.turn} ${castling} ${enPassant} 0 1`;
    const validation = validatePositionFen(candidateFen);
    if (validation.ok) fen = validation.game.fen();
    else fenError = validation.error;
  }
  const warnings = makeWarnings({
    modelReliable,
    modelPlausible: board.plausible,
    orientation,
    turn,
    conflict: turnEvidence.conflict,
    placementError,
    fenError,
    castling,
    enPassant,
    lastMove: lastMove !== null,
  });
  const ready = modelReliable && plausible && orientation !== null && turn !== null && fen !== null && !turnEvidence.conflict;
  const recognition: ScreenshotRecognition = {
    model: "Fenshot chess-tiles-v2",
    placement: normalizedPlacement,
    orientation: orientation ?? "unknown",
    orientationConfidence: orientationSignal.confidence,
    turn: turn?.turn ?? null,
    turnConfidence: turn?.confidence ?? 0,
    turnSource: turn?.source ?? null,
    turnDetail: turn?.detail ?? null,
    castling,
    enPassant,
    confidence: {
      mean: board.meanConfidence,
      minimum: board.minConfidence,
      threshold: CONFIDENCE_FLOOR,
    },
    confidenceBySquare: confidenceMap,
    bounds,
    plausible,
    ready,
    warnings,
    fen,
  };
  return { width, height, detection: { bounds }, recognition };
}
