import { describe, expect, it } from "vitest";
import { boardFromFen, boardFromPlacement, boardToFen, emptyBoard, validatePositionFen } from "@/lib/chess/position";
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

  it("marks low-confidence occupied and empty predictions as uncertain", () => {
    const board = boardFromPlacement("4k3/8/8/8/8/8/8/4K3", { e8: 0.4, a1: 0.2, e1: 0.99 });
    expect(board[0][4]).toBe("?");
    expect(board[7][0]).toBe("?");
    expect(board[0][0]).toBeNull();
    expect(board[7][4]).toBe("K");
  });

  it("rejects malformed piece placement", () => {
    expect(() => boardFromPlacement("4k3/8/8/8/8/8/8/4K2")).toThrow(/64 squares/i);
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
