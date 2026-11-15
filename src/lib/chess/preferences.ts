"use client";

export const DEFAULT_DEPTH = 14;
const DEPTH_KEY = "chessvision:depth:v1";
const ALLOWED_DEPTHS = [10, 14, 18] as const;

export type AnalysisDepth = (typeof ALLOWED_DEPTHS)[number];

export function readDepth(): AnalysisDepth {
  try {
    const value = Number(localStorage.getItem(DEPTH_KEY));
    return ALLOWED_DEPTHS.includes(value as AnalysisDepth) ? value as AnalysisDepth : DEFAULT_DEPTH;
  } catch {
    return DEFAULT_DEPTH;
  }
}

export function writeDepth(depth: number): void {
  if (!ALLOWED_DEPTHS.includes(depth as AnalysisDepth)) return;
  try {
    localStorage.setItem(DEPTH_KEY, String(depth));
  } catch {
    // Preferences are optional; the current screen still uses the selected value.
  }
}
