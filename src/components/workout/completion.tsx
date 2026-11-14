import Link from "next/link";
import { ArrowUpRight, Check, Flame, RotateCcw } from "lucide-react";
import type { Workout } from "@/lib/workouts/schema";
import { PreparationCard } from "./preparation-card";
import { formatTime } from "@/lib/utils";

export function Completion({
  workout,
  completedSets,
  elapsedSeconds,
}: {
  workout: Workout;
  completedSets: number;
  elapsedSeconds: number;
}) {
  return (
    <div className="completion-page">
      <section className="completion-hero" aria-labelledby="completion-title">
        <div className="completion-flame">
          <Flame strokeWidth={1.5} />
        </div>
        <div className="eyebrow">YOU SHOWED UP. YOU PUT IN THE WORK.</div>
        <h1 id="completion-title" tabIndex={-1}>
          Workout Complete <span className="completion-emoji">🔥</span>
        </h1>
        <p>
          That’s {workout.title.toLowerCase()}, done.
          <br />
          Take a breath. Give yourself some credit. You earned it.
        </p>
        <div className="completion-stats">
          <div>
            <strong>{workout.exercises.length}</strong>
            <span>Exercises completed</span>
          </div>
          <div>
            <strong>{completedSets}</strong>
            <span>Sets completed</span>
          </div>
          <div>
            <strong>
              {workout.estimatedDuration}
              <small>min</small>
            </strong>
            <span>Estimated workout duration</span>
          </div>
        </div>
        <Link href="/#builder" className="button button-primary">
          <RotateCcw size={16} /> Generate Another Workout <ArrowUpRight size={17} />
        </Link>
        <p className="completion-time">
          Session time logged: {formatTime(elapsedSeconds)} · This plan includes warm-up and
          cool-down time.
        </p>
      </section>
      <section className="completion-cooldown">
        <h2>One last thing: make space to recover.</h2>
        <PreparationCard type="cooldown" preparation={workout.cooldown} />
      </section>
      <details className="completion-review">
        <summary>Look back at your session</summary>
        <ul>
          {workout.exercises.map((exercise) => (
            <li key={exercise.id}>
              <Check size={13} />
              {exercise.name}
              <span>
                {exercise.sets} sets × {exercise.reps}
              </span>
            </li>
          ))}
        </ul>
      </details>
      <p className="completion-storage">
        Your latest session is saved on this device. Consistency is built one day at a time.
      </p>
    </div>
  );
}
