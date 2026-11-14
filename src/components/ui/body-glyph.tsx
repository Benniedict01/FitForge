import type { BodyPart } from "@/lib/workouts/schema";
import { cn } from "@/lib/utils";

export function BodyGlyph({ target, className }: { target: BodyPart; className?: string }) {
  const full = target === "Full Body";
  const on = (part: BodyPart) => full || target === part;
  const fill = (part: BodyPart) => (on(part) ? "currentColor" : "currentColor");
  const opacity = (part: BodyPart) => (on(part) ? 0.95 : 0.09);
  return (
    <svg className={cn("body-glyph", className)} viewBox="0 0 64 78" fill="none" aria-hidden="true">
      <circle cx="32" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" opacity=".45" />
      <path
        d="m24 19-8 4-5 13-4 16 5 2 6-15 2-6 1 18-2 22h8l5-20 5 20h8l-2-22 1-18 2 6 6 15 5-2-4-16-5-13-8-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity=".4"
      />
      <path
        d="m25 19-5 4 1 8 10 2V21l-6-2Zm14 0 5 4-1 8-10 2V21l6-2Z"
        fill={fill("Chest")}
        opacity={opacity("Chest")}
      />
      <path
        d="m19 22-4 3-3 9 6 2 4-11-3-3Zm26 0 4 3 3 9-6 2-4-11 3-3Z"
        fill={fill("Shoulders")}
        opacity={opacity("Shoulders")}
      />
      <path
        d="m12 35-3 12 4 1 5-11-6-2Zm40 0 3 12-4 1-5-11 6-2Z"
        fill={fill(target === "Triceps" ? "Triceps" : "Biceps")}
        opacity={opacity(target === "Triceps" ? "Triceps" : "Biceps")}
      />
      <path
        d="m23 35 8 1v7h-8v-8Zm10 1 8-1v8h-8v-7Zm-10 9h8v7l-7-2-1-5Zm10 0h8l-1 5-7 2v-7Z"
        fill={fill("Abs/Core")}
        opacity={opacity("Abs/Core")}
      />
      <path
        d="m22 51 9 3-5 17h-5l1-20Zm20 0-9 3 5 17h5l-1-20Z"
        fill={fill("Legs")}
        opacity={opacity("Legs")}
      />
      {target === "Back" && (
        <path d="m24 21 8 2 8-2 1 13-9 14-9-14 1-13Z" fill="currentColor" opacity=".85" />
      )}
      {target === "Glutes" && (
        <path
          d="M23 45c5-2 7 0 9 3 2-3 4-5 9-3l1 9c-5 5-8 1-10-1-2 2-5 6-10 1l1-9Z"
          fill="currentColor"
          opacity=".95"
        />
      )}
    </svg>
  );
}
