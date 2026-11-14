"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Flame,
  Heart,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  BODY_PARTS,
  DURATIONS,
  EQUIPMENT,
  EXPERIENCES,
  GOALS,
  workoutSchema,
  type Preferences,
} from "@/lib/workouts/schema";
import { cn } from "@/lib/utils";
import { BodyGlyph } from "@/components/ui/body-glyph";
import { EquipmentIcon } from "@/components/ui/equipment-icon";
import { ForgeMark } from "@/components/ui/logo";
import { useWorkout } from "@/components/workout/workout-provider";

const STEPS = [
  {
    key: "bodyPart",
    short: "Your focus",
    title: "What are you training today?",
    description: "Pick a muscle group. We’ll take it from there.",
  },
  {
    key: "equipment",
    short: "Your equipment",
    title: "What equipment do you have?",
    description: "A full gym or just you. We’ll make it work.",
  },
  {
    key: "experience",
    short: "Your experience",
    title: "What’s your experience level?",
    description: "Meet yourself where you are, not where you think you should be.",
  },
  {
    key: "goal",
    short: "Your goal",
    title: "What’s your goal?",
    description: "Give your training a purpose. We’ll build around it.",
  },
  {
    key: "duration",
    short: "Your time",
    title: "How much time do you have?",
    description: "Make room for a good session, not a complicated schedule.",
  },
] as const;

const equipmentDescriptions: Record<Preferences["equipment"], string> = {
  Bodyweight: "Just you. No gear needed.",
  Dumbbells: "A pair goes a long way.",
  Barbell: "Build strength with the basics.",
  Machines: "Controlled, guided movements.",
  Cable: "Smooth, constant resistance.",
  "Resistance Bands": "Light gear. Real resistance.",
  "Multiple Equipment": "Mix it up with a full gym.",
};
const experienceDescriptions = {
  Beginner: "New here or getting back to it.",
  Intermediate: "You’ve got the basics down.",
  Advanced: "Training is part of your routine.",
};
const goalDescriptions = {
  "Muscle Growth": "Build muscle, rep by rep.",
  Strength: "Move better. Lift stronger.",
  "Fat Loss": "Move with purpose and consistency.",
  "General Fitness": "Feel stronger for everyday life.",
};
const goalIcons = {
  "Muscle Growth": TrendingUp,
  Strength: Zap,
  "Fat Loss": Flame,
  "General Fitness": Heart,
};

export function WorkoutBuilder() {
  const router = useRouter();
  const { setWorkout } = useWorkout();
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [preferences, setPreferences] = useState<Preferences>({
    bodyPart: "Full Body",
    equipment: "Dumbbells",
    experience: "Beginner",
    goal: "Muscle Growth",
    duration: 45,
  });
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const current = STEPS[step];
  useEffect(() => () => abortRef.current?.abort(), []);

  function select<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((previous) => ({ ...previous, [key]: value }));
    setError("");
  }
  function goToStep(next: number) {
    setStep(next);
    setFurthest((previous) => Math.max(previous, next));
    setError("");
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      if (window.innerWidth < 760)
        document
          .getElementById("builder-card")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  async function generate() {
    if (generating) return;
    setGenerating(true);
    setError("");
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const response = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "We couldn’t build that workout. Please try again.");
      const parsed = workoutSchema.safeParse(data.workout);
      if (!parsed.success)
        throw new Error("That plan didn’t come through correctly. Let’s try again.");
      setWorkout(parsed.data);
      router.push("/workout");
    } catch (err) {
      if (controller.signal.aborted)
        setError("That took a little too long. Your choices are saved here—please try again.");
      else setError(err instanceof Error ? err.message : "Check your connection and try again.");
      setGenerating(false);
    } finally {
      clearTimeout(timeout);
    }
  }

  return (
    <section id="builder" className="builder-section page-width" aria-labelledby="builder-title">
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            <span /> THE WORKOUT BUILDER
          </div>
          <h2 id="builder-title">
            Your next workout.
            <br className="mobile-only" /> <span>Your way.</span>
          </h2>
        </div>
        <p>
          Five simple choices.
          <br />
          One session made for you.
        </p>
      </div>
      <div className="builder-shell" id="builder-card">
        <aside className="builder-sidebar" aria-label="Workout builder steps">
          <div className="sidebar-intro">
            <span className="tiny-label">LET’S MAKE IT PERSONAL</span>
            <h3>
              A little about you.
              <br />A lot of possibility.
            </h3>
          </div>
          <ol className="step-list">
            {STEPS.map((item, index) => (
              <li key={item.key}>
                <button
                  type="button"
                  disabled={index > furthest || generating}
                  onClick={() => goToStep(index)}
                  className={cn(
                    "step-button",
                    step === index && "step-current",
                    index < step && "step-done",
                  )}
                  aria-label={`Step ${index + 1}: ${item.short}`}
                  aria-current={step === index ? "step" : undefined}
                >
                  <span className="step-number">
                    {index < step ? <Check size={14} /> : `0${index + 1}`}
                  </span>
                  <span className="step-copy">
                    <span>{item.short}</span>
                    <small>
                      {index <= furthest
                        ? item.key === "duration"
                          ? `${preferences.duration} minutes`
                          : preferences[item.key]
                        : [
                            "",
                            "Work with what you have",
                            "Find your starting point",
                            "Train with purpose",
                            "Make every minute count",
                          ][index]}
                    </small>
                  </span>
                  {step === index && <ChevronRight size={16} className="step-chevron" />}
                </button>
              </li>
            ))}
          </ol>
          <div className="sidebar-note">
            <ShieldCheck size={19} />
            <span>
              Smart structure.
              <br />
              No guesswork.
            </span>
          </div>
        </aside>
        <form
          className="builder-main"
          aria-label="Personalize your workout"
          aria-busy={generating}
          onSubmit={(event) => {
            event.preventDefault();
            if (!generating) {
              if (step === 4) void generate();
              else goToStep(step + 1);
            }
          }}
        >
          {generating ? (
            <div className="generating-state" role="status" aria-live="polite">
              <div className="generating-orbit">
                <ForgeMark />
                <span />
              </div>
              <div className="eyebrow">MAKING IT YOURS</div>
              <h3>
                A good session
                <br />
                is taking shape.
              </h3>
              <p>
                Matching movements to your equipment,
                <br />
                experience, goals, and time.
              </p>
              <div className="generating-tags">
                <span>
                  <Check size={13} /> {preferences.bodyPart}
                </span>
                <span>
                  <Check size={13} /> {preferences.equipment}
                </span>
                <span>
                  <Clock3 size={13} /> {preferences.duration} min
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="form-progress">
                <span>
                  STEP 0{step + 1} <span className="muted">/ 05</span>
                </span>
                <span className="progress-track">
                  <span style={{ width: `${(step + 1) * 20}%` }} />
                </span>
                <span className="form-progress-caption">{current.short}</span>
              </div>
              <div className="step-content" key={step}>
                <h3 ref={headingRef} tabIndex={-1} id="step-title">
                  {current.title}
                </h3>
                <p className="step-description">{current.description}</p>
                <fieldset
                  className={cn("option-grid", `option-grid-${current.key}`)}
                  aria-labelledby="step-title"
                >
                  <legend className="sr-only">{current.title}</legend>
                  {step === 0 &&
                    BODY_PARTS.map((part) => (
                      <label
                        key={part}
                        className={cn(
                          "option-card body-option",
                          preferences.bodyPart === part && "option-selected",
                        )}
                      >
                        <input
                          type="radio"
                          aria-label={part}
                          name="bodyPart"
                          value={part}
                          checked={preferences.bodyPart === part}
                          onChange={() => select("bodyPart", part)}
                          className="option-input"
                        />
                        <span className="option-check">
                          {preferences.bodyPart === part && <Check size={10} strokeWidth={3} />}
                        </span>
                        <BodyGlyph target={part} />
                        <span className="option-label">{part}</span>
                      </label>
                    ))}
                  {step === 1 &&
                    EQUIPMENT.map((equipment) => (
                      <label
                        key={equipment}
                        className={cn(
                          "option-card equipment-option",
                          preferences.equipment === equipment && "option-selected",
                        )}
                      >
                        <input
                          type="radio"
                          aria-label={equipment}
                          name="equipment"
                          value={equipment}
                          checked={preferences.equipment === equipment}
                          onChange={() => select("equipment", equipment)}
                          className="option-input"
                        />
                        <span className="option-check">
                          {preferences.equipment === equipment && (
                            <Check size={10} strokeWidth={3} />
                          )}
                        </span>
                        <EquipmentIcon equipment={equipment} size={31} strokeWidth={1.5} />
                        <span className="option-label">{equipment}</span>
                        <span className="option-description">
                          {equipmentDescriptions[equipment]}
                        </span>
                      </label>
                    ))}
                  {step === 2 &&
                    EXPERIENCES.map((experience, index) => (
                      <label
                        key={experience}
                        className={cn(
                          "option-card experience-option",
                          preferences.experience === experience && "option-selected",
                        )}
                      >
                        <input
                          type="radio"
                          aria-label={experience}
                          name="experience"
                          value={experience}
                          checked={preferences.experience === experience}
                          onChange={() => select("experience", experience)}
                          className="option-input"
                        />
                        <span className="option-check">
                          {preferences.experience === experience && (
                            <Check size={10} strokeWidth={3} />
                          )}
                        </span>
                        <span className="level-bars" aria-hidden="true">
                          {[0, 1, 2].map((bar) => (
                            <span
                              key={bar}
                              className={bar <= index ? "level-on" : ""}
                              style={{ height: `${14 + bar * 11}px` }}
                            />
                          ))}
                        </span>
                        <span className="option-label">{experience}</span>
                        <span className="option-description">
                          {experienceDescriptions[experience]}
                        </span>
                      </label>
                    ))}
                  {step === 3 &&
                    GOALS.map((goal) => {
                      const Icon = goalIcons[goal];
                      return (
                        <label
                          key={goal}
                          className={cn(
                            "option-card goal-option",
                            preferences.goal === goal && "option-selected",
                          )}
                        >
                          <input
                            type="radio"
                            aria-label={goal}
                            name="goal"
                            value={goal}
                            checked={preferences.goal === goal}
                            onChange={() => select("goal", goal)}
                            className="option-input"
                          />
                          <span className="option-check">
                            {preferences.goal === goal && <Check size={10} strokeWidth={3} />}
                          </span>
                          <Icon size={30} strokeWidth={1.5} />
                          <span className="option-label">{goal}</span>
                          <span className="option-description">{goalDescriptions[goal]}</span>
                        </label>
                      );
                    })}
                  {step === 4 &&
                    DURATIONS.map((duration) => (
                      <label
                        key={duration}
                        className={cn(
                          "option-card duration-option",
                          preferences.duration === duration && "option-selected",
                        )}
                      >
                        <input
                          type="radio"
                          aria-label={`${duration} minutes`}
                          name="duration"
                          value={duration}
                          checked={preferences.duration === duration}
                          onChange={() => select("duration", duration)}
                          className="option-input"
                        />
                        <span className="option-check">
                          {preferences.duration === duration && <Check size={10} strokeWidth={3} />}
                        </span>
                        <span className="duration-number">{duration}</span>
                        <span className="option-description">minutes</span>
                      </label>
                    ))}
                </fieldset>
                {step === 4 && (
                  <div className="final-summary">
                    <span>
                      <Target size={17} /> YOUR SESSION, AT A GLANCE
                    </span>
                    <div>
                      {[
                        preferences.bodyPart,
                        preferences.equipment,
                        preferences.experience,
                        preferences.goal,
                      ].map((value) => (
                        <span key={value}>{value}</span>
                      ))}
                    </div>
                    <p>Includes a warm-up, tailored exercises, rest periods, and a cool-down.</p>
                  </div>
                )}
              </div>
              {error && (
                <div role="alert" className="form-error">
                  <CircleAlert size={18} />
                  <span>{error}</span>
                </div>
              )}
              <div className="builder-controls">
                <div>
                  {step > 0 ? (
                    <button
                      type="button"
                      className="button button-ghost back-button"
                      onClick={() => goToStep(step - 1)}
                    >
                      <ArrowLeft size={16} /> Back
                    </button>
                  ) : (
                    <span className="single-selection-note">
                      <Check size={14} /> Select one to get started
                    </span>
                  )}
                </div>
                <button type="submit" className="button button-primary builder-next">
                  {step === 4 ? (
                    <>
                      <Sparkles size={17} /> Generate My Workout
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
      <div className="builder-reassurance">
        <span>
          <LockKeyhole size={13} /> No account required
        </span>
        <span className="reassurance-separator" />
        <span>
          <Sparkles size={13} /> Designed around you
        </span>
        <span className="reassurance-separator" />
        <span>
          <Clock3 size={13} /> Ready in moments
        </span>
      </div>
    </section>
  );
}
