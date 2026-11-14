"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Workout } from "@/lib/workouts/schema";
import { loadWorkout, saveWorkout } from "@/lib/workouts/storage";

const WorkoutContext = createContext<{
  workout: Workout | null;
  ready: boolean;
  setWorkout: (workout: Workout) => void;
} | null>(null);
export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [workout, setCurrentWorkout] = useState<Workout | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Storage is read after hydration so server and initial client markup agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentWorkout(loadWorkout());
    setReady(true);
  }, []);
  function setWorkout(value: Workout) {
    saveWorkout(value);
    setCurrentWorkout(value);
  }
  return (
    <WorkoutContext.Provider value={{ workout, ready, setWorkout }}>
      {children}
    </WorkoutContext.Provider>
  );
}
export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) throw new Error("useWorkout requires WorkoutProvider");
  return context;
}
