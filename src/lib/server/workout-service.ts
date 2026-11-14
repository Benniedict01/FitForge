import "server-only";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { aiSelectionSchema, type Preferences, type Workout } from "@/lib/workouts/schema";
import { exerciseCount, generateWorkout, getCandidates } from "@/lib/workouts/generator";

export async function createWorkout(preferences: Preferences): Promise<Workout> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return generateWorkout(preferences);

  try {
    const client = new OpenAI({ apiKey, timeout: 18_000, maxRetries: 0 });
    const candidates = getCandidates(preferences).map(
      ({ id, name, equipment, difficulty, pattern, muscles }) => ({
        id,
        name,
        equipment,
        difficulty,
        pattern,
        muscles,
      }),
    );
    const result = await client.chat.completions.parse({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        {
          role: "system",
          content:
            "You are FitForge's conservative fitness planner. Return structured JSON only. Select exercise IDs ONLY from the supplied catalog, with no duplicate IDs. Prefer the user's selected equipment; bodyweight is a supplement. For Full Body include a squat or hinge, a push, a pull, and core if space allows. Put compound movements before isolation. Provide a short motivating title and one safe, practical coaching tip. Do not make medical claims, prescribe maximal effort, or promise fat loss from a body part. Sets, reps, instructions, and timing are calculated and validated by the server, not by you.",
        },
        {
          role: "user",
          content: JSON.stringify({
            preferences,
            exactExerciseCount: exerciseCount(preferences),
            catalog: candidates,
          }),
        },
      ],
      response_format: zodResponseFormat(aiSelectionSchema, "workout_selection"),
      max_completion_tokens: 800,
    });
    const selection = result.choices[0]?.message.parsed;
    if (!selection) throw new Error("No structured workout selection returned");
    return generateWorkout(preferences, selection);
  } catch {
    // Never log provider responses, authorization data, or secrets. A failed AI call
    // does not stop someone from training: the same vetted catalog powers fallback.
    console.warn("[FitForge] AI enhancement unavailable; using the local exercise library.");
    return generateWorkout(preferences);
  }
}
