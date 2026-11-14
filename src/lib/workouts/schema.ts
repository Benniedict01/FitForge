import { z } from "zod";

export const BODY_PARTS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Glutes",
  "Abs/Core",
  "Full Body",
] as const;
export const EQUIPMENT = [
  "Bodyweight",
  "Dumbbells",
  "Barbell",
  "Machines",
  "Cable",
  "Resistance Bands",
  "Multiple Equipment",
] as const;
export const EXPERIENCES = ["Beginner", "Intermediate", "Advanced"] as const;
export const GOALS = ["Muscle Growth", "Strength", "Fat Loss", "General Fitness"] as const;
export const DURATIONS = [15, 30, 45, 60, 90] as const;

export const preferencesSchema = z
  .object({
    bodyPart: z.enum(BODY_PARTS),
    equipment: z.enum(EQUIPMENT),
    experience: z.enum(EXPERIENCES),
    goal: z.enum(GOALS),
    duration: z.union([z.literal(15), z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
  })
  .strict();

export type Preferences = z.infer<typeof preferencesSchema>;
export type BodyPart = Preferences["bodyPart"];
export type Equipment = Exclude<Preferences["equipment"], "Multiple Equipment">;
export type Experience = Preferences["experience"];

export type ExerciseDefinition = {
  id: string;
  name: string;
  muscles: Exclude<BodyPart, "Full Body">[];
  equipment: Equipment;
  difficulty: Experience;
  instructions: string[];
  pattern: "push" | "pull" | "squat" | "hinge" | "core" | "isolation";
  mode?: "time" | "side";
};

export const workoutExerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  sets: z.number().int().min(1).max(5),
  reps: z.string(),
  restSeconds: z.number().int().min(15).max(180),
  instructions: z.array(z.string()).min(1),
  equipment: z.enum(EQUIPMENT.filter((e): e is Equipment => e !== "Multiple Equipment")),
  difficulty: z.enum(EXPERIENCES),
  targetMuscles: z.array(z.enum(BODY_PARTS)),
  workSeconds: z.number().positive(),
});

export const workoutSchema = z.object({
  id: z.string(),
  title: z.string(),
  targetMuscle: z.enum(BODY_PARTS),
  goal: z.enum(GOALS),
  estimatedDuration: z.number().positive(),
  preferences: preferencesSchema,
  warmup: z.object({
    durationMinutes: z.number(),
    movements: z.array(z.object({ name: z.string(), detail: z.string() })),
  }),
  exercises: z.array(workoutExerciseSchema).min(1),
  coachingTip: z.string(),
  cooldown: z.object({
    durationMinutes: z.number(),
    movements: z.array(z.object({ name: z.string(), detail: z.string() })),
  }),
  source: z.enum(["local", "ai"]),
  createdAt: z.string(),
});

export type WorkoutExercise = z.infer<typeof workoutExerciseSchema>;
export type Workout = z.infer<typeof workoutSchema>;

// The AI selects only catalog IDs, never inventing equipment or movement instructions.
export const aiSelectionSchema = z
  .object({
    title: z.string().min(4).max(85),
    coachingTip: z.string().min(10).max(250),
    exerciseIds: z.array(z.string()).min(2).max(6),
  })
  .strict();
export type AISelection = z.infer<typeof aiSelectionSchema>;
