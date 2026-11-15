import { Chess, validateFen } from "chess.js";

export const PIECE_CODES = ["K", "Q", "R", "B", "N", "P", "k", "q", "r", "b", "n", "p"] as const;
export type PieceCode = (typeof PIECE_CODES)[number];
export type SquareValue = PieceCode | "?" | null;
export type PositionBoard = SquareValue[][];
export type SideToMove = "w" | "b";
export type CastlingRight = "K" | "Q" | "k" | "q";
export type BoardOrientation = "white" | "black";

export const PIECE_NAMES: Record<PieceCode, string> = {
  K: "White king",
  Q: "White queen",
  R: "White rook",
  B: "White bishop",
  N: "White knight",
  P: "White pawn",
  k: "Black king",
  q: "Black queen",
  r: "Black rook",
  b: "Black bishop",
  n: "Black knight",
  p: "Black pawn",
};

export const PIECE_GLYPHS: Record<PieceCode, string> = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

export function emptyBoard(): PositionBoard {
  return Array.from({ length: 8 }, () => Array<SquareValue>(8).fill(null));
}

export function boardFromFen(fen: string): PositionBoard {
  const game = new Chess(fen);
  return game.board().map((row) =>
    row.map((piece) => (piece ? (piece.color === "w" ? piece.type.toUpperCase() : piece.type) as PieceCode : null),
    ),
  );
}

export function boardFromPlacement(
  placement: string,
  confidenceBySquare?: Record<string, number>,
  confidenceFloor = 0.7,
): PositionBoard {
  const ranks = placement.split("/");
  if (ranks.length !== 8) throw new Error("The recognized board must contain eight ranks.");
  return ranks.map((rank, rowIndex) => {
    const row: SquareValue[] = [];
    const addSquare = (piece: SquareValue) => {
      const file = row.length;
      const square = `${String.fromCharCode(97 + file)}${8 - rowIndex}`;
      const confidence = confidenceBySquare?.[square];
      row.push(confidence !== undefined && confidence < confidenceFloor ? "?" : piece);
    };
    for (const character of rank) {
      if (/^[1-8]$/.test(character)) {
        for (let index = 0; index < Number(character); index += 1) addSquare(null);
        continue;
      }
      if (!PIECE_CODES.includes(character as PieceCode)) throw new Error("The recognized board contains an invalid piece code.");
      addSquare(character as PieceCode);
    }
    if (row.length !== 8) throw new Error("The recognized board must contain exactly 64 squares.");
    return row;
  });
}

export function boardToFen(
  board: PositionBoard,
  turn: SideToMove,
  castling: CastlingRight[],
  enPassant: string,
): string {
  if (board.length !== 8 || board.some((row) => row.length !== 8)) {
    throw new Error("The board must contain exactly 64 squares.");
  }
  const rows = board.map((row) => {
    let encoded = "";
    let emptyCount = 0;
    for (const square of row) {
      if (square === "?") throw new Error("Mark every uncertain square as a piece or empty first.");
      if (square === null) {
        emptyCount += 1;
        continue;
      }
      if (emptyCount) encoded += String(emptyCount);
      emptyCount = 0;
      encoded += square;
    }
    if (emptyCount) encoded += String(emptyCount);
    return encoded;
  });
  const uniqueRights = ["K", "Q", "k", "q"].filter((right) => castling.includes(right as CastlingRight));
  return `${rows.join("/")} ${turn} ${uniqueRights.join("") || "-"} ${enPassant || "-"} 0 1`;
}

export function validatePositionFen(fen: string): { ok: true; game: Chess } | { ok: false; error: string } {
  const normalized = fen.trim();
  if (!normalized || normalized.length > 200) {
    return { ok: false, error: "Enter a complete six-field FEN position." };
  }
  const shape = validateFen(normalized);
  if (!shape.ok) return { ok: false, error: `Invalid FEN: ${shape.error}` };

  try {
    const game = new Chess(normalized);
    const [placement, turn, castling, ep, halfmove, fullmove] = normalized.split(/\s+/);
    const otherTurn = turn === "w" ? "b" : "w";
    const otherSideView = new Chess(`${placement} ${otherTurn} ${castling} ${ep} ${halfmove} ${fullmove}`);
    if (otherSideView.isCheck()) {
      return {
        ok: false,
        error: "This position is illegal: the king of the side that just moved cannot be left in check.",
      };
    }
    return { ok: true, game };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? `Invalid chess position: ${error.message}` : "Invalid chess position.",
    };
  }
}

export function squareFromDisplay(row: number, col: number, orientation: BoardOrientation): string {
  const file = orientation === "white" ? col : 7 - col;
  const rank = orientation === "white" ? 8 - row : row + 1;
  return `${String.fromCharCode(97 + file)}${rank}`;
}

export function displayFromSquare(square: string, orientation: BoardOrientation): { row: number; col: number } {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]);
  return orientation === "white"
    ? { row: 8 - rank, col: file }
    : { row: rank - 1, col: 7 - file };
}

export function fenFromPositionParts(parts: {
  placement: string;
  turn: SideToMove;
  castling: string;
  enPassant: string;
  halfmove: string;
  fullmove: string;
}): string {
  return [parts.placement, parts.turn, parts.castling, parts.enPassant, parts.halfmove, parts.fullmove].join(" ");
}
