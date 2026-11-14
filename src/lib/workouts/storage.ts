"use client";

import { workoutSchema, type Workout } from "./schema";

const WORKOUT_KEY = "fitforge:workout:v1";
const PROGRESS_KEY = "fitforge:progress:v1";

export function saveWorkout(workout: Workout): boolean {
  try {
    localStorage.setItem(WORKOUT_KEY, JSON.stringify(workout));
    localStorage.removeItem(PROGRESS_KEY);
    return true;
  } catch {
    return false;
  }
}
export function loadWorkout(): Workout | null {
  try {
    const value = localStorage.getItem(WORKOUT_KEY);
    if (!value) return null;
    const parsed = workoutSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export type WorkoutProgress = {
  workoutId: string;
  checked: string[];
  startedAt: number | null;
  finishedAt: number | null;
  restEndsAt: number | null;
  status: "ready" | "active" | "complete";
};
export function saveProgress(progress: WorkoutProgress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    /* Private browsing can disable storage. The current session still works. */
  }
}
export function loadProgress(workoutId: string): WorkoutProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (
      value.workoutId !== workoutId ||
      !Array.isArray(value.checked) ||
      !value.checked.every((s: unknown) => typeof s === "string") ||
      !["ready", "active", "complete"].includes(value.status) ||
      (value.startedAt !== null && !Number.isFinite(value.startedAt)) ||
      (value.finishedAt !== null && !Number.isFinite(value.finishedAt)) ||
      (value.restEndsAt !== null && !Number.isFinite(value.restEndsAt))
    )
      return null;
    return value as WorkoutProgress;
  } catch {
    return null;
  }
}
