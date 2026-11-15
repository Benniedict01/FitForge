import { describe, expect, it } from "vitest";
import { boardFromFen, boardToFen, emptyBoard, validatePositionFen } from "@/lib/chess/position";
import { SAMPLE_POSITIONS } from "@/lib/chess/samples";

describe("FEN and position validation", () => {
  it("round-trips a complete FEN without losing turn, rights, or en-passant state", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const result = validatePositionFen(fen);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const board = boardFromFen(fen);
    expect(boardToFen(board, "w", ["K", "Q", "k", "q"], "-")).toBe(fen);
  });

  it("rejects unknown cells rather than treating them as empty", () => {
    const board = emptyBoard();
    board[0][0] = "?";
    expect(() => boardToFen(board, "w", [], "-")).toThrow(/uncertain square/i);
  });

  it("rejects malformed and impossible positions", () => {
    expect(validatePositionFen("not a fen").ok).toBe(false);
    expect(validatePositionFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1").ok).toBe(true);
    expect(validatePositionFen("4k3/4R3/8/8/8/8/8/4K3 w - - 0 1")).toMatchObject({ ok: false });
  });

  it("keeps all sample FENs legal", () => {
    for (const sample of SAMPLE_POSITIONS) {
      expect(validatePositionFen(sample.fen), sample.title).toMatchObject({ ok: true });
    }
  });
});
