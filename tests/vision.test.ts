import { describe, expect, it } from "vitest";
import { detectChessboard, type RawRgbImage } from "@/lib/chess/vision";

function createScreenshot(options: { width: number; height: number; x: number; y: number; size: number; checkerboard: boolean }): RawRgbImage {
  const { width, height, x, y, size, checkerboard } = options;
  const data = new Uint8Array(width * height * 3);
  for (let py = 0; py < height; py += 1) {
    for (let px = 0; px < width; px += 1) {
      const index = (py * width + px) * 3;
      let color: [number, number, number] = [34, 39, 36];
      if (checkerboard && px >= x && px < x + size && py >= y && py < y + size) {
        const file = Math.min(7, Math.floor(((px - x) / size) * 8));
        const rank = Math.min(7, Math.floor(((py - y) / size) * 8));
        color = (file + rank) % 2 === 0 ? [226, 218, 190] : [91, 124, 92];
        const inTileX = ((px - x) % (size / 8)) / (size / 8);
        const inTileY = ((py - y) % (size / 8)) / (size / 8);
        if ((rank < 2 || rank > 5) && inTileX > 0.36 && inTileX < 0.64 && inTileY > 0.25 && inTileY < 0.77) {
          color = (file + rank) % 2 === 0 ? [244, 240, 222] : [27, 34, 29];
        }
      }
      data[index] = color[0];
      data[index + 1] = color[1];
      data[index + 2] = color[2];
    }
  }
  return { data, width, height, channels: 3 };
}

describe("screenshot board detection", () => {
  it("finds a scaled, axis-aligned 8x8 board and marks visual piece activity", () => {
    const image = createScreenshot({ width: 320, height: 480, x: 42, y: 113, size: 232, checkerboard: true });
    const detection = detectChessboard(image);
    expect(detection).not.toBeNull();
    expect(detection!.confidence).toBeGreaterThan(0.12);
    expect(detection!.bounds.x).toBeCloseTo(42 / 320, 1);
    expect(detection!.bounds.y).toBeCloseTo(113 / 480, 1);
    expect(detection!.bounds.width).toBeCloseTo(232 / 320, 1);
    expect(detection!.squareHints).toHaveLength(64);
    expect(detection!.squareHints.some((hint) => hint.likelyPiece)).toBe(true);
  });

  it("does not invent a board on a plain screenshot", () => {
    const image = createScreenshot({ width: 300, height: 500, x: 0, y: 0, size: 0, checkerboard: false });
    expect(detectChessboard(image)).toBeNull();
  });

  it("rejects too-small inputs", () => {
    expect(detectChessboard({ data: new Uint8Array(20 * 20 * 3), width: 20, height: 20, channels: 3 })).toBeNull();
  });
});
