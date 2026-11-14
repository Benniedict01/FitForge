"use client";

import Link from "next/link";
import { ArrowUpRight, Dumbbell, LoaderCircle } from "lucide-react";
import { useWorkout } from "./workout-provider";
import { WorkoutSession } from "./workout-session";

export function WorkoutPageClient() {
  const { workout, ready } = useWorkout();
  return (
    <main id="main-content" className="workout-page page-width">
      {!ready ? (
        <div className="loading-page" role="status">
          <LoaderCircle size={27} />
          <span>Getting your session ready…</span>
        </div>
      ) : !workout ? (
        <section className="workout-empty">
          <Dumbbell size={44} strokeWidth={1.5} />
          <div className="eyebrow" style={{ justifyContent: "center" }}>
            A GOOD PLACE TO START
          </div>
          <h1>Your next workout is waiting.</h1>
          <p>
            Tell us a little about your goals, equipment, and experience.
            <br />
            We’ll turn it into a session that’s yours.
          </p>
          <Link href="/#builder" className="button button-primary">
            Build My Workout <ArrowUpRight size={18} />
          </Link>
        </section>
      ) : (
        <WorkoutSession key={workout.id} workout={workout} />
      )}
    </main>
  );
}
