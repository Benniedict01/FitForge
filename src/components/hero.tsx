import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CirclePlay,
  Clock3,
  Dumbbell,
  MoveUpRight,
  ScanLine,
  Sparkles,
  Target,
} from "lucide-react";

export function Hero() {
  return (
    <section className="hero page-width" aria-labelledby="hero-title">
      <div className="hero-art" aria-hidden="true">
        <div className="hero-orbit hero-orbit-1" />
        <div className="hero-orbit hero-orbit-2" />
        <Image
          src="/images/athlete-hero.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 600px) 100vw, 65vw"
          className="hero-photo"
        />
        <div className="hero-photo-shade" />
        <div className="hero-coordinate">
          <span /> BUILT FOR YOUR BETTER.
        </div>
        <span className="hero-vertical">SHOW UP. GET STRONGER. REPEAT.</span>
        <div className="image-corner corner-top" />
        <div className="image-corner corner-bottom" />
      </div>
      <div className="hero-content">
        <div className="hero-badge">
          <span className="status-dot" />
          <span>
            YOUR AMBITION. <span>YOUR PLAN.</span>
          </span>
          <Sparkles size={13} />
        </div>
        <h1 id="hero-title" aria-label="Build Your Workout. Build Yourself.">
          <span>Build Your</span>
          <span>Workout.</span>
          <span className="hero-heading-accent">Build Yourself.</span>
        </h1>
        <p className="hero-description">
          Your goals. Your equipment. Your starting point.
          <br className="desktop-break" /> An AI-powered workout planner that puts it all to work.
        </p>
        <div className="hero-ctas">
          <Link href="#builder" className="button button-primary hero-primary">
            Build My Workout <ArrowUpRight size={20} />
          </Link>
          <Link href="#how-it-works" className="hero-secondary">
            <span>
              <CirclePlay size={18} strokeWidth={1.5} />
            </span>
            How it works
          </Link>
        </div>
        <div className="hero-microcopy">
          <Check size={13} /> No sign-up. No guesswork. Just your next good session.
        </div>
      </div>
      <Link
        href="#builder"
        className="session-preview"
        aria-label="Build your own personalized workout"
      >
        <div className="preview-top">
          <span>
            <span className="status-dot" /> A LOOK AT WHAT’S POSSIBLE
          </span>
          <MoveUpRight size={15} />
        </div>
        <div className="preview-title">
          <span className="preview-icon">
            <Dumbbell size={22} />
          </span>
          <div>
            <span className="preview-kicker">SAMPLE SESSION</span>
            <h3>Full Body Foundations</h3>
          </div>
        </div>
        <div className="preview-meta">
          <span>
            <Clock3 size={12} /> 45 min budget
          </span>
          <span>
            <Target size={12} /> General fitness
          </span>
        </div>
        <div className="preview-bottom">
          <span>A little structure. A lot of potential.</span>
          <span className="preview-arrow">
            <ArrowRight size={16} />
          </span>
        </div>
      </Link>
      <a className="hero-scroll" href="#builder" aria-label="Scroll to workout builder">
        <ArrowDown size={15} />
        <span>YOUR NEXT CHAPTER STARTS BELOW</span>
      </a>
    </section>
  );
}

export function BenefitsStrip() {
  return (
    <div className="benefits-wrap">
      <div className="benefits-strip page-width">
        <div>
          <span className="benefit-icon">
            <ScanLine size={21} strokeWidth={1.5} />
          </span>
          <p>
            <strong>Made for your goals</strong>
            <span>Not someone else’s routine.</span>
          </p>
          <ChevronRight size={16} className="benefit-chevron" />
        </div>
        <div>
          <span className="benefit-icon">
            <Dumbbell size={21} strokeWidth={1.5} />
          </span>
          <p>
            <strong>Your space. Your equipment.</strong>
            <span>A home corner or the gym floor.</span>
          </p>
          <ChevronRight size={16} className="benefit-chevron" />
        </div>
        <div>
          <span className="benefit-icon">
            <Clock3 size={21} strokeWidth={1.5} />
          </span>
          <p>
            <strong>Fits into real life</strong>
            <span>A plan for the time you actually have.</span>
          </p>
          <ChevronRight size={16} className="benefit-chevron" />
        </div>
      </div>
    </div>
  );
}
