import { Dumbbell, PersonStanding, Layers, type LucideProps } from "lucide-react";
import type { Preferences } from "@/lib/workouts/schema";

export function EquipmentIcon({
  equipment,
  ...props
}: LucideProps & { equipment: Preferences["equipment"] }) {
  if (equipment === "Bodyweight") return <PersonStanding {...props} />;
  if (equipment === "Dumbbells") return <Dumbbell {...props} />;
  if (equipment === "Multiple Equipment") return <Layers {...props} />;
  return (
    <svg
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden="true"
    >
      {equipment === "Barbell" && (
        <>
          <path d="M8 16h16M3 12v8m26-8v8M7 8v16m18-16v16" />
          <path d="M3 16h4m18 0h4" />
        </>
      )}
      {equipment === "Machines" && (
        <>
          <path d="M7 27V5h18v22M5 27h22M10 8h12M10 12h12M10 16h12M10 20h12M16 5V2" />
          <path d="M16 8v12M10 24h12" />
        </>
      )}
      {equipment === "Cable" && (
        <>
          <path d="M9 28V4h14v24M5 28h22M13 21h6m-6 3h6M16 7v14" />
          <circle cx="16" cy="7" r="3" />
          <path d="M19 7h8v9m-3 0h6m-6 0v3h6v-3" />
        </>
      )}
      {equipment === "Resistance Bands" && (
        <>
          <path d="M11 6c5-5 15-1 15 5 0 5-10 15-15 15-6 0-10-10-5-15l5-5Z" />
          <path d="M13 9c3-3 9-1 9 3s-6 10-10 10-6-6-3-9l4-4Z" />
        </>
      )}
    </svg>
  );
}
