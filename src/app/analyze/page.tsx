import type { Metadata } from "next";
import { AnalysisWorkspace } from "@/components/chess/analysis-workspace";

export const metadata: Metadata = { title: "Analysis workspace" };

export default function AnalyzePage() {
  return <AnalysisWorkspace />;
}
