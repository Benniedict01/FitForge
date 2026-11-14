import { Flame, Wind } from "lucide-react";
import type { Workout } from "@/lib/workouts/schema";

export function PreparationCard({
  type,
  preparation,
}: {
  type: "warmup" | "cooldown";
  preparation: Workout["warmup"];
}) {
  const Icon = type === "warmup" ? Flame : Wind;
  return (
    <section className="preparation-card" aria-labelledby={`${type}-title`}>
      <div className="preparation-heading">
        <Icon size={18} />
        <h2 id={`${type}-title`}>
          {type === "warmup" ? "First, find your rhythm." : "Finish with a little recovery."}
        </h2>
        <span>
          {type === "warmup" ? "WARM-UP" : "COOL-DOWN"} · {preparation.durationMinutes} MIN
        </span>
      </div>
      <ol>
        {preparation.movements.map((movement, index) => (
          <li key={movement.name}>
            <span>{index + 1}</span>
            <p>
              {movement.name}
              <small>{movement.detail}</small>
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
