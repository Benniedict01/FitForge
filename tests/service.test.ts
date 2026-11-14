import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Preferences } from "@/lib/workouts/schema";
const { parse } = vi.hoisted(() => ({ parse: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("openai", () => ({
  default: class {
    chat = { completions: { parse } };
  },
}));
import { createWorkout } from "@/lib/server/workout-service";
const base: Preferences = {
  bodyPart: "Chest",
  equipment: "Dumbbells",
  experience: "Beginner",
  goal: "Muscle Growth",
  duration: 15,
};

beforeEach(() => {
  parse.mockReset();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("secure optional AI service", () => {
  it("works without a configured API key and never calls OpenAI", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const workout = await createWorkout(base);
    expect(workout.source).toBe("local");
    expect(parse).not.toHaveBeenCalled();
  });
  it("falls back if the provider is unavailable", async () => {
    vi.stubEnv("OPENAI_API_KEY", "unit-test-key-not-real");
    parse.mockRejectedValue(new Error("Provider unavailable"));
    expect((await createWorkout(base)).source).toBe("local");
  });
  it("falls back if AI returns incompatible catalog IDs", async () => {
    vi.stubEnv("OPENAI_API_KEY", "unit-test-key-not-real");
    parse.mockResolvedValue({
      choices: [
        {
          message: {
            parsed: {
              title: "Bad plan",
              coachingTip: "Keep your movement controlled and safe.",
              exerciseIds: ["bb-floor-press", "db-floor-press", "db-squeeze-press"],
            },
          },
        },
      ],
    });
    expect((await createWorkout(base)).source).toBe("local");
  });
  it("falls back on an AI refusal or missing structured response", async () => {
    vi.stubEnv("OPENAI_API_KEY", "unit-test-key-not-real");
    parse.mockResolvedValue({ choices: [{ message: { parsed: null } }] });
    expect((await createWorkout(base)).source).toBe("local");
  });
  it("uses the structured selection while retaining authored instructions", async () => {
    vi.stubEnv("OPENAI_API_KEY", "unit-test-key-not-real");
    parse.mockResolvedValue({
      choices: [
        {
          message: {
            parsed: {
              title: "Chest Momentum",
              coachingTip: "Keep your movement controlled and safe.",
              exerciseIds: ["db-floor-press", "db-squeeze-press", "bw-knee-push-up"],
            },
          },
        },
      ],
    });
    const workout = await createWorkout(base);
    expect(workout.source).toBe("ai");
    expect(workout.exercises[0].instructions.length).toBe(3);
    expect(parse.mock.calls[0][0].response_format.type).toBe("json_schema");
  });
});
