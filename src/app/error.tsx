"use client";
import { CircleAlert, RotateCcw } from "lucide-react";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="page-width">
      <section className="workout-empty">
        <CircleAlert size={40} />
        <h1>A small pause, not the finish line.</h1>
        <p>
          Something didn’t load correctly. Your latest saved workout stays on this device. Let’s try
          that again.
        </p>
        <button className="button button-primary" type="button" onClick={reset}>
          <RotateCcw size={16} /> Try again
        </button>
      </section>
    </main>
  );
}
