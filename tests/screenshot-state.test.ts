import { describe, expect, it } from "vitest";
import {
  inferTurnFromOcr,
  inferTurnFromPosition,
  orientationEvidence,
  reconcileTurnEvidence,
  validateRecognizedPlacement,
  type OcrLine,
} from "@/lib/chess/screenshot-state";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
const FLIPPED_START = "RNBKQBNR/PPPPPPPP/8/8/8/8/pppppppp/rnbqkbnr";

describe("screenshot recognition state evidence", () => {
  it("uses pawn direction to distinguish white- and black-bottom boards", () => {
    expect(orientationEvidence(START).orientation).toBe("white");
    expect(orientationEvidence(FLIPPED_START).orientation).toBe("black");
    expect(orientationEvidence("4k3/8/8/8/8/8/8/4K3")).toMatchObject({ orientation: null, pawnSignal: null });
  });

  it("infers the initial side to move and the only side in check", () => {
    expect(inferTurnFromPosition(START)).toMatchObject({ turn: "w", source: "starting position" });
    expect(inferTurnFromPosition("4k3/4R3/8/8/8/8/8/K7")).toMatchObject({ turn: "b", source: "check status" });
    expect(inferTurnFromPosition("4k3/8/8/8/8/8/8/K7")).toBeNull();
  });

  it("accepts explicit OCR turn labels but does not invent a turn without evidence", () => {
    const line = (text: string): OcrLine => ({
      text,
      confidence: 95,
      bbox: { x0: 700, y0: 100, x1: 900, y1: 125 },
    });
    const bounds = { x0: 0, y0: 0, x1: 640, y1: 640 };
    expect(inferTurnFromOcr([line("Black to move")], bounds, START, "KQkq", "-")).toMatchObject({
      turn: "b",
      source: "screenshot text",
    });
    expect(inferTurnFromOcr([line("Stockfish analysis")], bounds, START, "KQkq", "-")).toBeNull();
  });

  it("rejects contradictory turn evidence", () => {
    expect(reconcileTurnEvidence([
      { turn: "w", confidence: 0.9, source: "position", detail: "white" },
      { turn: "b", confidence: 0.95, source: "OCR", detail: "black" },
    ])).toMatchObject({ inference: null, conflict: true });
  });

  it("rejects placements that cannot represent a legal chess board", () => {
    expect(validateRecognizedPlacement(START)).toBeNull();
    expect(validateRecognizedPlacement("8/8/8/8/8/8/8/8")).toMatch(/king/i);
    expect(validateRecognizedPlacement("4k3/8/8/8/8/8/8/4K2")).toMatch(/8×8/);
  });
});
