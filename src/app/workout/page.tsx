import type { Metadata } from "next";
import { WorkoutPageClient } from "@/components/workout/workout-page-client";
export const metadata: Metadata = {
  title: "Your workout — FitForge",
  robots: { index: false, follow: false },
};
export default function WorkoutPage() {
  return <WorkoutPageClient />;
}
