import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { POST } from "@/app/api/generate-workout/route";

const base = {
  bodyPart: "Chest",
  equipment: "Bodyweight",
  experience: "Beginner",
  goal: "General Fitness",
  duration: 15,
};
let sequence = 0;
function request(body: string, contentType = "application/json", ip = `test-api-${sequence++}`) {
  return new Request("http://fitforge.test/api/generate-workout", {
    method: "POST",
    headers: { "Content-Type": contentType, "X-Forwarded-For": ip },
    body,
  });
}
beforeEach(() => vi.stubEnv("OPENAI_API_KEY", ""));
afterEach(() => vi.unstubAllEnvs());

describe("generate-workout API", () => {
  it("returns a validated, uncached local workout without an API key", async () => {
    const response = await POST(request(JSON.stringify(base)));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const { workout } = await response.json();
    expect(workout.source).toBe("local");
    expect(
      workout.exercises.every(
        (exercise: { equipment: string }) => exercise.equipment === "Bodyweight",
      ),
    ).toBe(true);
  });
  it("rejects invalid preference values", async () => {
    const response = await POST(request(JSON.stringify({ ...base, equipment: "invented" })));
    expect(response.status).toBe(400);
  });
  it("rejects malformed JSON", async () => {
    expect((await POST(request("{"))).status).toBe(400);
  });
  it("rejects non-JSON request media types", async () => {
    expect((await POST(request(JSON.stringify(base), "text/plain"))).status).toBe(415);
  });
  it("bounds actual streamed bytes, even without Content-Length", async () => {
    expect((await POST(request("x".repeat(4097)))).status).toBe(413);
  });
  it("rate limits repeated requests and includes a retry deadline", async () => {
    const ip = "rate-limiter-unit-test";
    for (let index = 0; index < 12; index++)
      expect((await POST(request(JSON.stringify(base), "application/json", ip))).status).toBe(200);
    const response = await POST(request(JSON.stringify(base), "application/json", ip));
    expect(response.status).toBe(429);
    expect(Number(response.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});
