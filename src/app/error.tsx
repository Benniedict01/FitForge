"use client";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main-content" className="page-width error-page">
      <section className="empty-state-card">
        <span className="error-icon"><AlertTriangle size={24} /></span>
        <p className="eyebrow">ENGINE INTERRUPTED</p>
        <h1>That analysis didn’t finish.</h1>
        <p>Your position is still on this device. Retry the analysis or return to the workspace.</p>
        <div className="button-row">
          <button className="button button-primary" type="button" onClick={reset}><RotateCcw size={16} /> Try again</button>
          <Link className="button button-outline" href="/analyze">Workspace</Link>
        </div>
      </section>
    </main>
  );
}
