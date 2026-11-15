import { describe, expect, it } from "vitest";
import { Chess } from "chess.js";
import { SAMPLE_POSITIONS } from "@/lib/chess/samples";
import { formatEvaluation, analyzeWithStockfish, toWhitePerspective } from "@/lib/server/stockfish";

describe("Stockfish 19 Lite WASM", () => {
  it("returns a legal best move and three MultiPV alternatives from a real search", async () => {
    const sample = SAMPLE_POSITIONS.find((item) => item.id === "opening")!;
    const result = await analyzeWithStockfish(sample.fen, 8);
    expect(result.engine).toContain("Stockfish 19");
    expect(result.bestmove).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
    expect(result.lines.length).toBeGreaterThanOrEqual(3);
    const game = new Chess(sample.fen);
    expect(game.move({ from: result.bestmove!.slice(0, 2), to: result.bestmove!.slice(2, 4) })).toBeTruthy();
    expect(result.lines[0].pv[0]).toBe(result.bestmove);
  }, 15_000);

  it("normalizes UCI scores to White's perspective", () => {
    expect(toWhitePerspective({ type: "cp", value: 82 }, "w")).toEqual({ type: "cp", value: 82 });
    expect(toWhitePerspective({ type: "cp", value: 82 }, "b")).toEqual({ type: "cp", value: -82 });
    expect(toWhitePerspective({ type: "mate", value: 3 }, "b")).toEqual({ type: "mate", value: -3 });
    expect(formatEvaluation({ type: "cp", value: 80 })).toBe("+0.8");
    expect(formatEvaluation({ type: "mate", value: -3 })).toBe("−#3");
  });
});
