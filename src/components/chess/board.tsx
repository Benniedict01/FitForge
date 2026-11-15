import type { ReactNode } from "react";
import { displayFromSquare, PIECE_GLYPHS, PIECE_NAMES, squareFromDisplay, type BoardOrientation, type PieceCode, type PositionBoard, type SquareValue } from "@/lib/chess/position";

type ChessBoardProps = {
  board: PositionBoard;
  orientation?: BoardOrientation;
  selectedSquare?: string | null;
  markedSquares?: string[];
  move?: { from: string; to: string } | null;
  onSquareClick?: (square: string) => void;
  label?: string;
  children?: ReactNode;
};

function pieceLabel(piece: SquareValue) {
  if (piece === "?") return "Unconfirmed piece";
  if (!piece) return "Empty";
  return PIECE_NAMES[piece];
}

export function ChessBoard({
  board,
  orientation = "white",
  selectedSquare = null,
  markedSquares = [],
  move = null,
  onSquareClick,
  label = "Chess position",
  children,
}: ChessBoardProps) {
  const squares = Array.from({ length: 64 }, (_, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    const square = squareFromDisplay(row, col, orientation);
    const file = square.charCodeAt(0) - 97;
    const rank = Number(square[1]);
    const piece = board[8 - rank]?.[file] ?? null;
    const isDark = (file + rank) % 2 === 1;
    const isMoveSquare = move?.from === square || move?.to === square;
    const isFrom = move?.from === square;
    const classes = [
      "board-square",
      isDark ? "board-square-dark" : "board-square-light",
      isMoveSquare ? "board-square-move" : "",
      isFrom ? "board-square-from" : "",
      markedSquares.includes(square) ? "board-square-hint" : "",
      selectedSquare === square ? "board-square-selected" : "",
    ].filter(Boolean).join(" ");
    const code = piece && piece !== "?" ? piece as PieceCode : null;
    return (
      <button
        type="button"
        className={classes}
        key={square}
        aria-label={`${square}, ${pieceLabel(piece)}${markedSquares.includes(square) ? ", visually flagged for review" : ""}`}
        aria-pressed={selectedSquare === square}
        onClick={() => onSquareClick?.(square)}
        tabIndex={onSquareClick ? 0 : undefined}
      >
        {col === 0 && <span className="board-coordinate board-coordinate-rank" aria-hidden="true">{rank}</span>}
        {row === 7 && <span className="board-coordinate board-coordinate-file" aria-hidden="true">{String.fromCharCode(97 + file)}</span>}
        {code && <span className={code === code.toUpperCase() ? "chess-piece piece-white" : "chess-piece piece-black"} aria-hidden="true">{PIECE_GLYPHS[code]}</span>}
        {piece === "?" && <span className="board-unknown" aria-hidden="true">?</span>}
        {markedSquares.includes(square) && piece !== "?" && <span className="board-hint-dot" aria-hidden="true" />}
      </button>
    );
  });

  let arrow: ReactNode = null;
  if (move) {
    const start = displayFromSquare(move.from, orientation);
    const end = displayFromSquare(move.to, orientation);
    const x1 = ((start.col + 0.5) / 8) * 100;
    const y1 = ((start.row + 0.5) / 8) * 100;
    const x2 = ((end.col + 0.5) / 8) * 100;
    const y2 = ((end.row + 0.5) / 8) * 100;
    arrow = (
      <svg className="board-arrow-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs><marker id="move-arrow-head" markerWidth="6" markerHeight="6" refX="4.3" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="currentColor" /></marker></defs>
        <line x1={x1} y1={y1} x2={x2} y2={y2} className="board-arrow-line" markerEnd="url(#move-arrow-head)" />
      </svg>
    );
  }

  return (
    <div className="board-shell">
      <div className="chess-board" role="grid" aria-label={label}>
        {squares}
        {arrow}
      </div>
      {children}
    </div>
  );
}
