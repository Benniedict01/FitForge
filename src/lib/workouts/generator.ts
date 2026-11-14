import { EXERCISES, EXERCISES_BY_ID } from "./exercises";
import {
  type AISelection,
  type ExerciseDefinition,
  type Preferences,
  type Workout,
  type WorkoutExercise,
  workoutSchema,
} from "./schema";

const level = { Beginner: 0, Intermediate: 1, Advanced: 2 };
const smallMuscles = new Set(["Biceps", "Triceps", "Shoulders", "Abs/Core"]);

export function getCandidates(preferences: Preferences): ExerciseDefinition[] {
  return EXERCISES.filter(
    (exercise) =>
      (preferences.bodyPart === "Full Body" || exercise.muscles.includes(preferences.bodyPart)) &&
      (preferences.equipment === "Multiple Equipment" ||
        exercise.equipment === preferences.equipment ||
        exercise.equipment === "Bodyweight") &&
      level[exercise.difficulty] <= level[preferences.experience],
  ).sort((a, b) => {
    // The selected equipment takes precedence over supplemental bodyweight work.
    const priority = (exercise: ExerciseDefinition) =>
      (exercise.equipment === preferences.equipment ? 100 : 0) +
      (exercise.equipment !== "Bodyweight" && preferences.equipment === "Multiple Equipment"
        ? 15
        : 0) +
      (exercise.muscles[0] === preferences.bodyPart ? 50 : 0) +
      (exercise.pattern !== "isolation" ? 5 : 0);
    return priority(b) - priority(a);
  });
}

export function exerciseCount(
  preferences: Preferences,
  available = getCandidates(preferences).length,
): number {
  const byTime = { 15: 3, 30: 4, 45: 5, 60: 6, 90: 6 }[preferences.duration];
  const focusCap = smallMuscles.has(preferences.bodyPart) ? 4 : 6;
  const beginnerCap =
    preferences.experience === "Beginner" && preferences.bodyPart !== "Full Body" ? 4 : 6;
  return Math.min(byTime, focusCap, beginnerCap, available);
}

function pickExercises(preferences: Preferences): ExerciseDefinition[] {
  const candidates = getCandidates(preferences);
  const count = exerciseCount(preferences, candidates.length);
  if (preferences.bodyPart !== "Full Body" && preferences.equipment !== "Multiple Equipment")
    return candidates.slice(0, count);

  const picked: ExerciseDefinition[] = [];
  if (preferences.bodyPart !== "Full Body") {
    // A mixed-equipment session should actually make use of different tools.
    for (const exercise of candidates) {
      if (picked.length >= count) break;
      if (!picked.some((other) => other.equipment === exercise.equipment)) picked.push(exercise);
    }
  }
  // A full-body plan covers lower body, pushing, pulling, and (time permitting) core.
  if (preferences.bodyPart === "Full Body")
    for (const pattern of ["squat", "push", "pull", "core", "hinge", "isolation"]) {
      const matches = candidates.filter(
        (exercise) => exercise.pattern === pattern && !picked.includes(exercise),
      );
      const next =
        preferences.equipment === "Multiple Equipment"
          ? (matches.find(
              (exercise) => !picked.some((other) => other.equipment === exercise.equipment),
            ) ?? matches[0])
          : matches[0];
      if (next && picked.length < count) picked.push(next);
    }
  for (const exercise of candidates) {
    if (picked.length >= count) break;
    if (!picked.includes(exercise)) picked.push(exercise);
  }
  return picked;
}

function prescription(
  exercise: ExerciseDefinition,
  preferences: Preferences,
): Omit<WorkoutExercise, "sets"> {
  const isBeginner = preferences.experience === "Beginner";
  let reps: string;
  let workSeconds: number;
  if (exercise.mode === "time") {
    const hold = isBeginner ? 20 : preferences.experience === "Advanced" ? 40 : 30;
    reps = `${hold} sec`;
    workSeconds = hold + 8;
  } else {
    const ranges = {
      "Muscle Growth": [8, 12],
      Strength: isBeginner || exercise.pattern === "isolation" ? [6, 8] : [4, 6],
      "Fat Loss": [12, 15],
      "General Fitness": [10, 12],
    };
    const [min, max] = ranges[preferences.goal];
    reps = `${min}–${max}${exercise.mode === "side" ? " / side" : ""}`;
    workSeconds = Math.round(((min + max) / 2) * 3 * (exercise.mode === "side" ? 2 : 1)) + 8;
  }
  const baseRest = {
    "Muscle Growth": 75,
    Strength: isBeginner ? 90 : 150,
    "Fat Loss": 45,
    "General Fitness": 60,
  }[preferences.goal];
  const restSeconds = exercise.pattern === "isolation" ? Math.min(baseRest, 90) : baseRest;
  return {
    id: exercise.id,
    name: exercise.name,
    reps,
    restSeconds,
    instructions: exercise.instructions,
    equipment: exercise.equipment,
    difficulty: exercise.difficulty,
    targetMuscles: exercise.muscles,
    workSeconds,
  };
}

export function estimateSeconds(
  exercises: WorkoutExercise[],
  warmupMinutes: number,
  cooldownMinutes: number,
): number {
  const workAndRest = exercises.reduce(
    (sum, exercise) => sum + exercise.sets * (exercise.workSeconds + exercise.restSeconds),
    0,
  );
  const finalRest = exercises.at(-1)?.restSeconds ?? 0;
  return (
    (warmupMinutes + cooldownMinutes) * 60 +
    workAndRest -
    finalRest +
    Math.max(0, exercises.length - 1) * 20
  );
}

function preparation(preferences: Preferences) {
  const warmupMinutes = { 15: 2, 30: 4, 45: 5, 60: 6, 90: 8 }[preferences.duration];
  const cooldownMinutes = { 15: 1, 30: 3, 45: 4, 60: 5, 90: 6 }[preferences.duration];
  const lower = preferences.bodyPart === "Legs" || preferences.bodyPart === "Glutes";
  const core = preferences.bodyPart === "Abs/Core";
  const warmupMoves = lower
    ? ["Easy march in place", "Slow bodyweight hip hinges", "Comfortable bodyweight squats"]
    : core
      ? ["Easy march in place", "Gentle standing torso turns", "Slow alternating bird dogs"]
      : preferences.bodyPart === "Full Body"
        ? [
            "Easy march and arm swings",
            "Gentle hip hinges and squats",
            "Shoulder circles and wall push-ups",
          ]
        : [
            "Easy march in place",
            "Gentle shoulder and arm circles",
            "Slow wall push-ups and shoulder-blade squeezes",
          ];
  const cooldownMoves = lower
    ? ["Gentle standing quad stretch", "Seated hamstring stretch", "Slow relaxed breathing"]
    : core
      ? [
          "Gentle child's pose or seated reach",
          "Comfortable supine knee hugs",
          "Slow relaxed breathing",
        ]
      : preferences.bodyPart === "Full Body"
        ? [
            "Gentle chest and shoulder stretch",
            "Comfortable seated hamstring stretch",
            "Slow relaxed breathing",
          ]
        : [
            "Gentle cross-body shoulder stretch",
            "Comfortable standing chest opener",
            "Slow relaxed breathing",
          ];
  const split = (minutes: number, index: number) =>
    Math.floor((minutes * 60) / 3) + (index === 2 ? (minutes * 60) % 3 : 0);
  return {
    warmup: {
      durationMinutes: warmupMinutes,
      movements: warmupMoves.map((name, index) => ({
        name,
        detail: `${split(warmupMinutes, index)} sec · easy, controlled pace`,
      })),
    },
    cooldown: {
      durationMinutes: cooldownMinutes,
      movements: cooldownMoves.map((name, index) => ({
        name,
        detail: `${split(cooldownMinutes, index)} sec · gentle, never painful; split stretches between sides`,
      })),
    },
  };
}

function coachingTip(preferences: Preferences): string {
  if (preferences.equipment === "Bodyweight" && ["Back", "Biceps"].includes(preferences.bodyPart)) {
    return "Without a pulling load, back and biceps work has limits. Use slow, deliberate tension; add bands or weights over time for greater strength and muscle growth.";
  }
  if (preferences.goal === "Fat Loss")
    return "Keep your movement controlled, not rushed. Fat loss comes from consistent activity, nutrition, and recovery—not targeting fat in one specific body part.";
  if (preferences.experience === "Beginner")
    return "Start light and leave 2–3 good reps in reserve. A controlled rep beats a heavier one. Rest longer whenever you need to keep your technique solid.";
  if (preferences.goal === "Strength")
    return "Leave 1–2 reps in reserve and respect your rest periods. Add a little weight only when every rep looks controlled. Use a spotter for loaded presses.";
  return "Make the last rep look like the first. Control the lowering phase, stop 1–2 reps before form breaks, and increase load only when the full rep range feels solid.";
}

function validateAISelection(
  selection: AISelection,
  preferences: Preferences,
): ExerciseDefinition[] {
  const allowed = new Set(getCandidates(preferences).map((exercise) => exercise.id));
  if (new Set(selection.exerciseIds).size !== selection.exerciseIds.length)
    throw new Error("Duplicate exercise selection");
  if (selection.exerciseIds.length !== exerciseCount(preferences))
    throw new Error("Incorrect exercise count");
  if (selection.exerciseIds.some((id) => !allowed.has(id)))
    throw new Error("Incompatible exercise selection");
  const selected = selection.exerciseIds.map((id) => EXERCISES_BY_ID.get(id)!);
  if (
    preferences.equipment !== "Bodyweight" &&
    preferences.equipment !== "Multiple Equipment" &&
    getCandidates(preferences).some((exercise) => exercise.equipment === preferences.equipment) &&
    !selected.some((exercise) => exercise.equipment === preferences.equipment)
  )
    throw new Error("Selected equipment not used");
  if (preferences.bodyPart === "Full Body") {
    const patterns = new Set(selected.map((exercise) => exercise.pattern));
    if (
      !patterns.has("push") ||
      !patterns.has("pull") ||
      (!patterns.has("squat") && !patterns.has("hinge"))
    ) {
      throw new Error("Full-body coverage missing");
    }
  }
  return selected;
}

export function generateWorkout(preferences: Preferences, aiSelection?: AISelection): Workout {
  const definitions = aiSelection
    ? validateAISelection(aiSelection, preferences)
    : pickExercises(preferences);
  const { warmup, cooldown } = preparation(preferences);
  const exercises: WorkoutExercise[] = definitions.map((exercise) => ({
    ...prescription(exercise, preferences),
    sets: 1,
  }));
  const maxSets =
    preferences.experience === "Beginner"
      ? 3
      : preferences.experience === "Advanced" && preferences.goal === "Strength"
        ? 5
        : 4;
  const budget = preferences.duration * 60;
  // Add sets round-robin, never exceeding the requested time budget or experience cap.
  for (let round = 1; round < maxSets; round++) {
    for (const exercise of exercises) {
      exercise.sets += 1;
      if (estimateSeconds(exercises, warmup.durationMinutes, cooldown.durationMinutes) > budget)
        exercise.sets -= 1;
    }
  }
  const focus = preferences.bodyPart === "Abs/Core" ? "Core" : preferences.bodyPart;
  const title = `${focus} ${preferences.goal === "Strength" ? "Strength Session" : preferences.goal === "Muscle Growth" ? "Muscle Builder" : preferences.goal === "Fat Loss" ? "Conditioning" : "Foundations"}`;
  return workoutSchema.parse({
    id: globalThis.crypto.randomUUID(),
    title: aiSelection?.title ?? title,
    targetMuscle: preferences.bodyPart,
    goal: preferences.goal,
    estimatedDuration: Math.ceil(
      estimateSeconds(exercises, warmup.durationMinutes, cooldown.durationMinutes) / 60,
    ),
    preferences,
    warmup,
    exercises,
    coachingTip: aiSelection?.coachingTip ?? coachingTip(preferences),
    cooldown,
    source: aiSelection ? "ai" : "local",
    createdAt: new Date().toISOString(),
  });
}
