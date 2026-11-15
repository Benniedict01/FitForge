import { afterEach, describe, expect, it } from "vitest";
import sharp from "sharp";
import { POST } from "@/app/api/analyze/route";
import { resetRateLimitsForTests } from "@/lib/server/rate-limit";

function jsonRequest(body: unknown, ip = "198.51.100.10") {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": ip },
    body: JSON.stringify(body),
  });
}

async function boardPng() {
  const width = 320;
  const height = 480;
  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 3;
      let rgb = [34, 39, 36];
      if (x >= 42 && x < 274 && y >= 113 && y < 345) {
        const file = Math.floor(((x - 42) / 232) * 8);
        const rank = Math.floor(((y - 113) / 232) * 8);
        rgb = (file + rank) % 2 === 0 ? [226, 218, 190] : [91, 124, 92];
      }
      raw[index] = rgb[0];
      raw[index + 1] = rgb[1];
      raw[index + 2] = rgb[2];
    }
  }
  return sharp(raw, { raw: { width, height, channels: 3 } }).png().toBuffer();
}

afterEach(() => resetRateLimitsForTests());

describe("POST /api/analyze", () => {
  it("rejects illegal FEN instead of calling the engine", async () => {
    const response = await POST(jsonRequest({ fen: "not a fen", depth: 10 }));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ success: false, code: "INVALID_POSITION" });
  });

  it("analyzes a valid FEN with Stockfish and returns alternative lines", async () => {
    const response = await POST(jsonRequest({ fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", depth: 8 }, "198.51.100.11"));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ success: true, status: "analyzed", engine: "Stockfish 19 Lite WASM" });
    expect(data.bestMove).toEqual(expect.any(String));
    expect(data.uci).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
    expect(data.alternatives.length).toBeGreaterThanOrEqual(3);
    expect(data.principalVariation.length).toBeGreaterThan(0);
  }, 15_000);

  it("returns the engine's forced mate rather than a canned move", async () => {
    const response = await POST(jsonRequest({ fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", depth: 10 }, "198.51.100.14"));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ success: true, status: "analyzed", bestMove: "Qg7#", uci: "g6g7", evaluation: "#1", score: { type: "mate", value: 1 } });
  }, 15_000);

  it("reports evaluation from White's perspective for a Black-to-move position", async () => {
    const response = await POST(jsonRequest({ fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1", depth: 8 }, "198.51.100.15"));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ success: true, status: "analyzed", piece: "Black pawn" });
    expect(data.score.type).toBe("cp");
    expect(data.evaluation.startsWith("+")).toBe(true);
  }, 15_000);

  it("preserves mixed-case multipart boundaries and never claims piece recognition", async () => {
    const png = await boardPng();
    const boundary = "----WebKitFormBoundaryAaBbCcDd";
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="board.png"\r\nContent-Type: image/png\r\n\r\n`),
      png,
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="depth"\r\n\r\n10\r\n--${boundary}--\r\n`),
    ]);
    const request = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "content-type": `multipart/form-data; boundary=${boundary}`, "x-real-ip": "198.51.100.12" },
      body,
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ success: true, status: "needs_review", requiresReview: true, fen: null, bestMove: null, privacy: { retained: false } });
    expect(data.detection.squareHints).toHaveLength(64);
  }, 15_000);

  it("returns a review error for unsupported image formats", async () => {
    const form = new FormData();
    form.append("image", new File(["not an image"], "capture.heic", { type: "image/heic" }));
    const response = await POST(new Request("http://localhost/api/analyze", { method: "POST", headers: { "x-real-ip": "198.51.100.13" }, body: form }));
    expect(response.status).toBe(415);
    expect(await response.json()).toMatchObject({ success: false, code: "UNSUPPORTED_IMAGE" });
  });
});
