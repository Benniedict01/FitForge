"use client";

import type { AnalysisResult } from "./analysis-types";

export type HistoryEntry = Pick<AnalysisResult, "fen" | "bestMove" | "uci" | "piece" | "from" | "to" | "evaluation" | "depth" | "engine" | "analyzedAt" | "principalVariation"> & {
  id: string;
};

const HISTORY_KEY = "chessvision:history:v1";
const MAX_HISTORY = 30;

export function loadHistory(): HistoryEntry[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is HistoryEntry =>
      entry &&
      typeof entry === "object" &&
      typeof entry.id === "string" &&
      typeof entry.fen === "string" &&
      typeof entry.bestMove === "string" &&
      typeof entry.evaluation === "string" &&
      typeof entry.analyzedAt === "string",
    ).slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export function saveAnalysisToHistory(result: AnalysisResult): boolean {
  try {
    const current = loadHistory();
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fen: result.fen,
      bestMove: result.bestMove,
      uci: result.uci,
      piece: result.piece,
      from: result.from,
      to: result.to,
      evaluation: result.evaluation,
      depth: result.depth,
      engine: result.engine,
      analyzedAt: result.analyzedAt,
      principalVariation: result.principalVariation,
    };
    localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...current].slice(0, MAX_HISTORY)));
    return true;
  } catch {
    return false;
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // The page still clears in-memory history when local storage is blocked.
  }
}
