import Link from "next/link";
import { ArrowUpRight, ListChecks, SlidersHorizontal, Target, Zap } from "lucide-react";
import { Hero, BenefitsStrip } from "@/components/hero";
import { WorkoutBuilder } from "@/components/builder/workout-builder";

export default function HomePage() {
  return (
    <main id="main-content">
      <Hero />
      <BenefitsStrip />
      <WorkoutBuilder />
      <section id="how-it-works" className="how-section page-width" aria-labelledby="how-title">
        <div className="section-heading">
          <div>
            <div className="eyebrow">
              <span /> LESS PLANNING. MORE TRAINING.
            </div>
            <h2 id="how-title">
              From “what now?” to <span>let’s go.</span>
            </h2>
          </div>
          <p>
            No endless scrolling.
            <br />
            Just a clear next step.
          </p>
        </div>
        <div className="how-grid">
          {[
            {
              icon: Target,
              number: "01",
              title: "Set your direction.",
              text: "Tell us what you’re training and what you want to work toward. Every good plan starts with you.",
            },
            {
              icon: SlidersHorizontal,
              number: "02",
              title: "Make it your own.",
              text: "Your equipment, experience, and available time shape the movements, volume, and pace of your session.",
            },
            {
              icon: ListChecks,
              number: "03",
              title: "Put in the work.",
              text: "Follow clear instructions, tick off your sets, and use the built-in rest timer. One good rep at a time.",
            },
          ].map(({ icon: Icon, number, title, text }) => (
            <article className="how-card" key={number}>
              <div>
                <span className="how-icon">
                  <Icon size={24} strokeWidth={1.5} />
                </span>
                <span className="how-number">{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        id="the-approach"
        className="approach-section page-width"
        aria-labelledby="approach-title"
      >
        <div className="approach-panel">
          <div className="approach-symbol" aria-hidden="true">
            <Zap size={88} strokeWidth={1} />
          </div>
          <div>
            <div className="eyebrow">A LITTLE STRONGER, EVERY SESSION.</div>
            <h2 id="approach-title">
              Progress isn’t complicated.
              <br />
              <span>Showing up is the first rep.</span>
            </h2>
            <p>
              Thoughtful exercise selection. Room to recover. A plan you can actually follow. That’s
              the FitForge approach—built on the basics, built around you.
            </p>
          </div>
          <Link className="button button-primary" href="#builder">
            Find your next workout <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
