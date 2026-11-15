import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main-content" className="page-width error-page">
      <section className="empty-state-card">
        <p className="eyebrow">NO POSITION HERE</p>
        <h1>We can’t find that page.</h1>
        <p>Head back to the board and continue your analysis.</p>
        <Link href="/" className="button button-primary"><ArrowLeft size={16} /> Back to ChessVision</Link>
      </section>
    </main>
  );
}
