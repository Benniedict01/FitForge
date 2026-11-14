import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export default function NotFound() {
  return (
    <main id="main-content" className="page-width">
      <section className="workout-empty">
        <div className="eyebrow" style={{ justifyContent: "center" }}>
          404 · A DIFFERENT DIRECTION
        </div>
        <h1>This isn’t your next workout.</h1>
        <p>That page isn’t here, but a good training session could be.</p>
        <Link href="/" className="button button-primary">
          Back to FitForge <ArrowUpRight size={17} />
        </Link>
      </section>
    </main>
  );
}
