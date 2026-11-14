import { ArrowUpRight, HeartPulse } from "lucide-react";
import Link from "next/link";
import { Logo } from "./ui/logo";
import { DISCLAIMER } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="site-footer page-width">
      <div className="footer-top">
        <div>
          <Logo />
          <p>Less guesswork. More good reps.</p>
        </div>
        <Link href="/#builder" className="footer-link">
          Your next session starts here <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="disclaimer">
        <HeartPulse size={17} aria-hidden="true" />
        <p>{DISCLAIMER}</p>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} FitForge. Built for your better.</span>
        <span>
          <span className="status-dot" /> Progress over perfection.
        </span>
      </div>
    </footer>
  );
}
