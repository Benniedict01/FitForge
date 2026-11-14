"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Clock3,
  Flame,
  Lightbulb,
  ListChecks,
  Play,
  Plus,
  ShieldCheck,
  SkipForward,
  Sparkles,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import type { Workout } from "@/lib/workouts/schema";
import { loadProgress, saveProgress, type WorkoutProgress } from "@/lib/workouts/storage";
import { formatTime } from "@/lib/utils";
import { ExerciseCard } from "./exercise-card";
import { PreparationCard } from "./preparation-card";
import { Completion } from "./completion";

export function WorkoutSession({ workout }: { workout: Workout }) {
  const allSetIds = useMemo(
    () =>
      workout.exercises.flatMap((exercise) =>
        Array.from({ length: exercise.sets }, (_, index) => `${exercise.id}:${index}`),
      ),
    [workout],
  );
  const [progress, setProgress] = useState<WorkoutProgress>(() => {
    const saved = loadProgress(workout.id);
    if (saved) {
      const checked = saved.checked.filter(
        (id, index, all) => allSetIds.includes(id) && all.indexOf(id) === index,
      );
      return {
        ...saved,
        checked,
        status:
          saved.status === "complete" && checked.length < allSetIds.length
            ? "active"
            : saved.status,
      };
    }
    return {
      workoutId: workout.id,
      checked: [],
      startedAt: null,
      finishedAt: null,
      restEndsAt: null,
      status: "ready",
    };
  });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);
  useEffect(() => {
    if (progress.status !== "active") return;
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, [progress.status]);

  const checked = new Set(progress.checked);
  const totalSets = allSetIds.length;
  const percentage = Math.round((checked.size / totalSets) * 100);
  const nextSetId = allSetIds.find((id) => !checked.has(id));
  const currentExercise = workout.exercises.find((exercise) =>
    nextSetId?.startsWith(`${exercise.id}:`),
  );
  const currentSet = nextSetId ? Number(nextSetId.split(":")[1]) + 1 : 0;
  const restSeconds = progress.restEndsAt
    ? Math.max(0, Math.ceil((progress.restEndsAt - now) / 1000))
    : 0;
  const elapsedSeconds = progress.startedAt
    ? Math.max(0, Math.floor(((progress.finishedAt ?? now) - progress.startedAt) / 1000))
    : 0;
  const active = progress.status === "active";

  function startWorkout() {
    const timestamp = Date.now();
    setNow(timestamp);
    setProgress((previous) => ({
      ...previous,
      startedAt: previous.startedAt ?? timestamp,
      status: "active",
    }));
    requestAnimationFrame(() =>
      document
        .getElementById("session-tracker")
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }
  function toggleSet(id: string) {
    if (!active || !allSetIds.includes(id)) return;
    const timestamp = Date.now();
    setNow(timestamp);
    setProgress((previous) => {
      const next = new Set(previous.checked);
      const removing = next.has(id);
      if (removing) next.delete(id);
      else next.add(id);
      const isComplete = next.size === totalSets;
      const exerciseId = id.split(":")[0];
      const rest =
        workout.exercises.find((exercise) => exercise.id === exerciseId)?.restSeconds ?? 60;
      return {
        ...previous,
        checked: [...next],
        status: isComplete ? "complete" : "active",
        finishedAt: isComplete ? timestamp : null,
        restEndsAt: !removing && !isComplete ? timestamp + rest * 1000 : null,
      };
    });
    if (!checked.has(id) && checked.size + 1 === totalSets)
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        document.getElementById("completion-title")?.focus({ preventScroll: true });
      });
  }
  function skipRest() {
    setProgress((previous) => ({ ...previous, restEndsAt: null }));
  }
  function addRest() {
    const timestamp = Date.now();
    setNow(timestamp);
    setProgress((previous) => ({
      ...previous,
      restEndsAt: Math.max(previous.restEndsAt ?? timestamp, timestamp) + 15_000,
    }));
  }

  if (progress.status === "complete")
    return (
      <Completion workout={workout} completedSets={checked.size} elapsedSeconds={elapsedSeconds} />
    );

  return (
    <>
      <nav className="workout-breadcrumb" aria-label="Breadcrumb">
        <Link href="/#builder">
          <ArrowLeft size={13} /> Workout builder
        </Link>
        <ChevronRight size={12} />
        <span>Your session</span>
      </nav>
      <div className="workout-heading">
        <div>
          <div className="eyebrow">
            <span /> {active ? "THIS IS YOUR TIME" : "YOUR PLAN. YOUR POTENTIAL."}
          </div>
          <h1>{workout.title}</h1>
          <p>A session built around you. Find your rhythm and make every rep count.</p>
        </div>
        {!active ? (
          <button type="button" className="button button-primary" onClick={startWorkout}>
            <Play size={16} fill="currentColor" /> Start Workout <ArrowUpRight size={18} />
          </button>
        ) : (
          <Link href="/#builder" className="button button-outline">
            Build another plan <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
      <div className="workout-source">
        {workout.source === "ai" ? <Sparkles size={12} /> : <ShieldCheck size={12} />}{" "}
        {workout.source === "ai"
          ? "AI-personalized · Catalog-validated movements"
          : "Built with the FitForge exercise library"}
      </div>
      <div className="workout-stats">
        <div>
          <Target />
          <p>
            <strong>{workout.targetMuscle}</strong>
            <small>Target muscle</small>
          </p>
        </div>
        <div>
          <Flame />
          <p>
            <strong>{workout.goal}</strong>
            <small>Your goal</small>
          </p>
        </div>
        <div>
          <Clock3 />
          <p>
            <strong>~{workout.estimatedDuration} minutes</strong>
            <small>{workout.preferences.duration}-minute time budget</small>
          </p>
        </div>
        <div>
          <ListChecks />
          <p>
            <strong>
              {workout.exercises.length} exercises · {totalSets} sets
            </strong>
            <small>{workout.preferences.experience} session</small>
          </p>
        </div>
      </div>
      <div className="workout-layout">
        <div className="workout-main-column">
          {active && (
            <div className="active-mobile-label">
              <span>
                <strong>{currentExercise?.name}</strong>
                <small>
                  Current set {currentSet} of {currentExercise?.sets} · {percentage}% complete
                </small>
              </span>
              {restSeconds > 0 ? (
                <>
                  <span className="mobile-timer" aria-label={`Rest ${formatTime(restSeconds)}`}>
                    {formatTime(restSeconds)}
                  </span>
                  <button
                    type="button"
                    onClick={skipRest}
                    aria-label="Skip rest from mobile tracker"
                  >
                    Skip rest
                  </button>
                </>
              ) : (
                <span className="mobile-timer">{percentage}%</span>
              )}
            </div>
          )}
          <PreparationCard type="warmup" preparation={workout.warmup} />
          <div className="exercise-list-heading">
            <h2>Your working sets</h2>
            <span>
              {checked.size} / {totalSets} sets completed
            </span>
          </div>
          {!active && (
            <p className="start-notice">
              Start your workout to unlock set tracking and your rest timer. Warm up before your
              first working set.
            </p>
          )}
          <div className="exercise-list">
            {workout.exercises.map((exercise, index) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                index={index}
                active={active}
                current={active && currentExercise?.id === exercise.id}
                checked={checked}
                onToggle={toggleSet}
                focus={workout.targetMuscle}
              />
            ))}
          </div>
          <PreparationCard type="cooldown" preparation={workout.cooldown} />
        </div>
        <aside className="workout-aside" aria-label="Session tools and coaching">
          <section id="session-tracker" className="session-tracker" aria-label="Workout progress">
            <div className="tracker-label">
              <span className="status-dot" />{" "}
              {active ? "YOUR SESSION IS LIVE" : "READY WHEN YOU ARE"}
            </div>
            <div className="tracker-body">
              {active ? (
                <>
                  <span className="tiny-label">CURRENT EXERCISE</span>
                  <h2 style={{ marginTop: 9 }}>{currentExercise?.name}</h2>
                  <div className="tracker-current-set">
                    Exercise{" "}
                    {workout.exercises.findIndex(
                      (exercise) => exercise.id === currentExercise?.id,
                    ) + 1}{" "}
                    of {workout.exercises.length} · {currentExercise?.reps}
                    {!currentExercise?.reps.includes("sec") && " reps"}
                  </div>
                  <div className="tracker-set-tag">
                    Current set {currentSet} of {currentExercise?.sets}
                  </div>
                </>
              ) : (
                <>
                  <h2>
                    A little focus.
                    <br />A stronger finish.
                  </h2>
                  <p className="tracker-ready-copy">
                    Warm up first, choose a manageable load, and leave a few good reps in reserve.
                  </p>
                  <button type="button" className="button button-primary" onClick={startWorkout}>
                    <Play size={14} fill="currentColor" /> Start Workout
                  </button>
                </>
              )}
              <div className="tracker-progress">
                <span>Your progress</span>
                <strong>{percentage}%</strong>
              </div>
              <div
                className="tracker-progress-track"
                role="progressbar"
                aria-label="Workout completion"
                aria-valuenow={percentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${percentage}%` }} />
              </div>
              <div className="tracker-progress-caption">
                <span>
                  {checked.size} of {totalSets} sets
                </span>
                <span>
                  <Timer size={10} style={{ display: "inline", marginRight: 4 }} />
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
            </div>
            {active &&
              (restSeconds > 0 ? (
                <div className="rest-timer">
                  <span className="rest-timer-label">
                    <Clock3 size={12} /> REST TIMER
                  </span>
                  <div className="rest-timer-time" role="timer" aria-label="Rest time remaining">
                    {formatTime(restSeconds)}
                  </div>
                  <p>Reset your breath. Protect your next rep.</p>
                  <div className="rest-timer-buttons">
                    <button type="button" onClick={addRest}>
                      <Plus size={11} /> 15 seconds
                    </button>
                    <button type="button" onClick={skipRest}>
                      Skip rest <SkipForward size={11} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rest-ready">
                  <Zap size={15} /> You’re up. Keep it controlled.
                </div>
              ))}
          </section>
          <section className="coaching-card">
            <h2>
              <Lightbulb size={15} /> A little coaching goes a long way
            </h2>
            <p>{workout.coachingTip}</p>
            <p className="safety-note">
              Pain isn’t progress. Stop if you experience pain, dizziness, or unusual symptoms. Take
              extra rest whenever you need it.
            </p>
          </section>
          <section className="plan-facts">
            <h2>THE PLAN, AT A GLANCE</h2>
            <dl>
              <div>
                <dt>Equipment</dt>
                <dd>{workout.preferences.equipment}</dd>
              </div>
              <div>
                <dt>Experience</dt>
                <dd>{workout.preferences.experience}</dd>
              </div>
              <div>
                <dt>Warm-up</dt>
                <dd>{workout.warmup.durationMinutes} minutes</dd>
              </div>
              <div>
                <dt>Cool-down</dt>
                <dd>{workout.cooldown.durationMinutes} minutes</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
