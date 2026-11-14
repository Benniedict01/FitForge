"use client";

import { useState } from "react";
import { Check, ChevronDown, Clock3, Info } from "lucide-react";
import type { BodyPart, WorkoutExercise } from "@/lib/workouts/schema";
import { cn } from "@/lib/utils";
import { BodyGlyph } from "@/components/ui/body-glyph";
import { EquipmentIcon } from "@/components/ui/equipment-icon";

export function ExerciseCard({
  exercise,
  index,
  active,
  current,
  checked,
  onToggle,
  focus,
}: {
  exercise: WorkoutExercise;
  index: number;
  active: boolean;
  current: boolean;
  checked: Set<string>;
  onToggle: (id: string) => void;
  focus: BodyPart;
}) {
  const [instructionsOpen, setInstructionsOpen] = useState(index === 0);
  const done = Array.from({ length: exercise.sets }, (_, set) => `${exercise.id}:${set}`).every(
    (id) => checked.has(id),
  );
  return (
    <article
      id={`exercise-${exercise.id}`}
      className={cn(
        "exercise-card",
        current && "exercise-card-current",
        done && "exercise-card-done",
      )}
      aria-labelledby={`title-${exercise.id}`}
    >
      <div className="exercise-card-top">
        <span
          className="exercise-number"
          aria-label={done ? "Exercise completed" : `Exercise ${index + 1}`}
        >
          {done ? <Check size={17} /> : `${index + 1}`.padStart(2, "0")}
        </span>
        <div className="exercise-card-title">
          <h3 id={`title-${exercise.id}`}>{exercise.name}</h3>
          <div className="exercise-prescription">
            <span>
              {exercise.sets} sets <span aria-hidden="true">×</span> {exercise.reps}
              {!exercise.reps.includes("sec") && " reps"}
            </span>
            <span className="rest-text">
              <Clock3 size={11} /> Rest: {exercise.restSeconds} seconds
            </span>
          </div>
        </div>
        <BodyGlyph
          target={focus === "Full Body" ? exercise.targetMuscles[0] : focus}
          className="exercise-glyph"
        />
      </div>
      <div className="exercise-tags">
        <span>
          <EquipmentIcon equipment={exercise.equipment} size={10} />
          {exercise.equipment}
        </span>
        <span>{exercise.difficulty}</span>
        {current && <span>Current exercise</span>}
      </div>
      <div className="set-checkboxes" role="group" aria-label={`Track sets for ${exercise.name}`}>
        {Array.from({ length: exercise.sets }, (_, set) => {
          const id = `${exercise.id}:${set}`;
          const isChecked = checked.has(id);
          return (
            <label key={id} className={cn("set-checkbox", isChecked && "set-checkbox-checked")}>
              <input
                type="checkbox"
                className="set-input"
                aria-label={`${exercise.name}, Set ${set + 1}`}
                checked={isChecked}
                disabled={!active}
                onChange={() => onToggle(id)}
              />
              <span className="checkbox-visual" aria-hidden="true">
                {isChecked && <Check size={9} strokeWidth={3} />}
              </span>
              Set {set + 1}
            </label>
          );
        })}
      </div>
      <button
        type="button"
        className="instructions-toggle"
        aria-expanded={instructionsOpen}
        aria-controls={`instructions-${exercise.id}`}
        onClick={() => setInstructionsOpen(!instructionsOpen)}
      >
        <Info size={12} /> Exercise instructions{" "}
        <ChevronDown size={12} className={instructionsOpen ? "instructions-open" : ""} />
      </button>
      {instructionsOpen && (
        <ol id={`instructions-${exercise.id}`} className="exercise-instructions">
          {exercise.instructions.map((instruction) => (
            <li key={instruction}>{instruction}</li>
          ))}
        </ol>
      )}
    </article>
  );
}
