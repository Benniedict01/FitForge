import { Chess, type PieceSymbol, type Square } from "chess.js";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { AnalysisResult, EngineLine } from "@/lib/chess/analysis-types";
import { PIECE_NAMES, validatePositionFen } from "@/lib/chess/position";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { analyzeWithStockfish, formatEvaluation, toWhitePerspective, type UciLine } from "@/lib/server/stockfish";
import { inspectChessScreenshot, MAX_IMAGE_BYTES } from "@/lib/server/image-recognition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_MULTIPART_BODY = MAX_IMAGE_BYTES + 256 * 1024;
const MAX_JSON_BODY = 16 * 1024;
const inputSchema = z.object({ fen: z.string().min(1).max(200), depth: z.number().int().min(8).max(18).default(14) }).strict();

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function requestKey(request: Request): string {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  ).slice(0, 120);
}

async function readBounded(request: Request, maxBytes: number): Promise<Buffer> {
  const declaredSize = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredSize) && declaredSize > maxBytes) throw new Error("BODY_TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("EMPTY_BODY");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("BODY_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total);
}

function depthFromForm(value: FormDataEntryValue | null): number {
  if (value === null || value === "") return 14;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 8 && parsed <= 18 ? parsed : Number.NaN;
}

function moveToSan(game: Chess, uci: string): { san: string; piece: string; from: string; to: string } | null {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return null;
  const from = uci.slice(0, 2) as Square;
  const to = uci.slice(2, 4) as Square;
  const source = game.get(from);
  if (!source) return null;
  const piece = PIECE_NAMES[source.color === "w" ? source.type.toUpperCase() as keyof typeof PIECE_NAMES : source.type as keyof typeof PIECE_NAMES];
  try {
    const move = game.move({ from, to, ...(uci[4] ? { promotion: uci[4] as PieceSymbol } : {}) });
    return move ? { san: move.san, piece, from, to } : null;
  } catch {
    return null;
  }
}

function parseVariation(fen: string, uciMoves: string[]): string[] {
  const game = new Chess(fen);
  const san: string[] = [];
  for (const uci of uciMoves) {
    const move = moveToSan(game, uci);
    if (!move) break;
    san.push(move.san);
  }
  return san;
}

function buildEngineLine(fen: string, rootTurn: "w" | "b", line: UciLine, rank: number): EngineLine | null {
  const firstUci = line.pv[0];
  if (!firstUci) return null;
  const firstMove = moveToSan(new Chess(fen), firstUci);
  if (!firstMove) return null;
  const score = toWhitePerspective(line.score, rootTurn);
  return {
    rank,
    move: firstMove.san,
    uci: firstUci,
    piece: firstMove.piece,
    from: firstMove.from,
    to: firstMove.to,
    evaluation: formatEvaluation(score),
    score,
    depth: line.depth,
    principalVariation: parseVariation(fen, line.pv),
    pvUci: line.pv,
  };
}

function describeBestMove(game: Chess, best: EngineLine): string {
  if (best.score.type === "mate") {
    const side = best.score.value > 0 ? "White" : "Black";
    return `Stockfish sees a forced mate in ${Math.abs(best.score.value)} for ${side}. The principal variation starts ${best.principalVariation.slice(0, 5).join(" ") || best.move}.`;
  }
  if (best.move.includes("#")) return "This move checkmates. Stockfish confirms there is no legal reply.";
  const position = new Chess(game.fen());
  const move = moveToSan(position, best.uci);
  const action = move?.san.includes("+") ? "It gives check" : move?.san.includes("x") ? "It captures a piece" : "";
  const line = best.principalVariation.slice(0, 5).join(" ");
  return `${action ? `${action}; ` : ""}Stockfish ranks ${best.move} first at depth ${best.depth}. Its principal variation is ${line || best.move}, with an evaluation of ${best.evaluation} from White's perspective.`;
}

async function analyzePosition(fen: string, depth: number) {
  const validation = validatePositionFen(fen);
  if (!validation.ok) return json({ success: false, status: "error", code: "INVALID_POSITION", error: validation.error }, 400);
  const game = validation.game;
  if (game.isCheckmate()) {
    return json({ success: true, status: "finished", result: "checkmate", fen: game.fen(), bestMove: null, message: "The side to move is already checkmated." });
  }
  if (game.isStalemate()) {
    return json({ success: true, status: "finished", result: "stalemate", fen: game.fen(), bestMove: null, message: "This position is stalemate. There is no legal move." });
  }
  if (game.isDraw()) {
    return json({ success: true, status: "finished", result: "draw", fen: game.fen(), bestMove: null, message: "This position is already drawn under the chess rules." });
  }

  try {
    const engine = await analyzeWithStockfish(game.fen(), depth);
    if (!engine.bestmove || engine.lines.length === 0) {
      return json({ success: false, status: "error", code: "ENGINE_NO_MOVE", error: "Stockfish did not return a legal move for this position." }, 503);
    }
    const orderedLines = [...engine.lines].sort((a, b) => a.rank - b.rank);
    const bestUci = engine.bestmove;
    const primaryLine = orderedLines.find((line) => line.rank === 1) ?? orderedLines[0];
    const selectedLine = primaryLine.pv[0] === bestUci
      ? primaryLine
      : { ...primaryLine, pv: [bestUci, ...primaryLine.pv.filter((move) => move !== bestUci)] };
    const best = buildEngineLine(game.fen(), game.turn(), selectedLine, 1);
    if (!best) return json({ success: false, status: "error", code: "ENGINE_INVALID_MOVE", error: "Stockfish returned a move that could not be validated." }, 503);

    const alternatives = orderedLines
      .filter((line) => line.rank !== 1 && line.pv[0] !== best.uci)
      .map((line, index) => buildEngineLine(game.fen(), game.turn(), line, index + 2))
      .filter((line): line is EngineLine => line !== null)
      .slice(0, 3);
    const result: AnalysisResult = {
      success: true,
      status: "analyzed",
      fen: game.fen(),
      bestMove: best.move,
      uci: best.uci,
      piece: best.piece,
      from: best.from,
      to: best.to,
      evaluation: best.evaluation,
      score: best.score,
      explanation: describeBestMove(game, best),
      principalVariation: best.principalVariation,
      pvUci: best.pvUci,
      alternatives,
      depth: best.depth,
      engine: engine.engine,
      analyzedAt: new Date().toISOString(),
    };
    return json(result);
  } catch (error) {
    return json({
      success: false,
      status: "error",
      code: "ENGINE_UNAVAILABLE",
      error: error instanceof Error ? error.message : "Stockfish could not complete the analysis.",
    }, 503);
  }
}

async function analyzeScreenshot(file: File) {
  if (file.size === 0) return json({ success: false, status: "error", code: "EMPTY_IMAGE", error: "The uploaded image is empty." }, 400);
  if (file.size > MAX_IMAGE_BYTES) return json({ success: false, status: "error", code: "IMAGE_TOO_LARGE", error: "Image is larger than the 10 MB upload limit." }, 413);
  const mime = file.type.toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
    return json({ success: false, status: "error", code: "UNSUPPORTED_IMAGE", error: "Use a JPEG, PNG, or WebP screenshot. HEIC files must be converted to JPEG." }, 415);
  }
  try {
    const inspected = await inspectChessScreenshot(Buffer.from(await file.arrayBuffer()), mime);
    if (!inspected.detection || !inspected.recognition) {
      return json({
        success: false,
        status: "error",
        code: "BOARD_NOT_FOUND",
        error: "No clear, axis-aligned 8×8 chessboard was detected. Use a screenshot with the full board visible.",
      }, 422);
    }

    const recognition = inspected.recognition;
    const details = recognition.warnings.map((warning) => warning.message).join(" ");
    return json({
      success: true,
      status: "needs_review",
      requiresReview: true,
      fen: recognition.fen,
      bestMove: null,
      message: recognition.ready
        ? "The board and a candidate position were recognized. Review every square, side to move, castling right, and en-passant field before asking Stockfish to analyze it."
        : `The board was detected, but a confidence or game-state check needs correction. Review the warnings and marked squares before confirming the position.${details ? ` ${details}` : ""}`,
      recognition,
      image: { width: inspected.width, height: inspected.height },
      privacy: { retained: false },
    });
  } catch (error) {
    console.error("Screenshot recognition failed:", error);
    const message = error instanceof Error ? error.message : "The screenshot could not be processed.";
    if (message.startsWith("Unsupported image")) {
      return json({ success: false, status: "error", code: "UNSUPPORTED_IMAGE", error: message }, 415);
    }
    if (/vision model|onnx|wasm|model returned/i.test(message)) {
      return json({ success: false, status: "error", code: "VISION_MODEL_UNAVAILABLE", error: "The local chess-recognition model could not start. Try again or use the optional position editor." }, 503);
    }
    return json({ success: false, status: "error", code: "IMAGE_PROCESSING_FAILED", error: message }, 422);
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type")?.trim() ?? "";
  const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase() ?? "";
  if (mediaType !== "application/json" && mediaType !== "multipart/form-data") {
    return json({ success: false, code: "UNSUPPORTED_MEDIA_TYPE", error: "Send a JSON FEN request or multipart form containing an image." }, 415);
  }

  const limit = checkRateLimit(requestKey(request));
  if (!limit.allowed) {
    return json({ success: false, code: "RATE_LIMITED", error: "Too many analyses. Please wait a minute and retry." }, 429, { "Retry-After": String(limit.retryAfter) });
  }

  if (mediaType === "application/json") {
    let body: unknown;
    try {
      const buffer = await readBounded(request, MAX_JSON_BODY);
      body = JSON.parse(buffer.toString("utf8"));
    } catch (error) {
      const tooLarge = error instanceof Error && error.message === "BODY_TOO_LARGE";
      return json({ success: false, code: tooLarge ? "BODY_TOO_LARGE" : "INVALID_JSON", error: tooLarge ? "JSON request is too large." : "Request body must be valid JSON." }, tooLarge ? 413 : 400);
    }
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) return json({ success: false, code: "INVALID_REQUEST", error: "Provide a valid FEN and a depth from 8 to 18." }, 400);
    return analyzePosition(parsed.data.fen, parsed.data.depth);
  }

  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!boundary) return json({ success: false, code: "INVALID_MULTIPART", error: "Multipart boundary is missing." }, 400);
  try {
    const body = await readBounded(request, MAX_MULTIPART_BODY);
    const form = await new Response(new Uint8Array(body), { headers: { "content-type": contentType } }).formData();
    const fenEntry = form.get("fen");
    const depth = depthFromForm(form.get("depth"));
    if (!Number.isInteger(depth)) return json({ success: false, code: "INVALID_DEPTH", error: "Depth must be an integer from 8 to 18." }, 400);
    if (typeof fenEntry === "string" && fenEntry.trim()) return analyzePosition(fenEntry, depth);
    const imageEntry = form.get("image");
    if (!imageEntry || typeof imageEntry === "string" || !("arrayBuffer" in imageEntry)) {
      return json({ success: false, code: "IMAGE_REQUIRED", error: "Add an image file using the multipart field named image." }, 400);
    }
    return await analyzeScreenshot(imageEntry as File);
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === "BODY_TOO_LARGE";
    return json({ success: false, code: tooLarge ? "BODY_TOO_LARGE" : "INVALID_MULTIPART", error: tooLarge ? "Upload exceeds the 10 MB image limit." : "Could not read the multipart upload." }, tooLarge ? 413 : 400);
  }
}
