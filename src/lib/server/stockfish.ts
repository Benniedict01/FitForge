import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import type { SideToMove } from "@/lib/chess/position";

export type UciScore = { type: "cp" | "mate"; value: number };
export type UciLine = { rank: number; depth: number; score: UciScore; pv: string[] };

const ENGINE_PATH = resolve(process.cwd(), "public/engine/stockfish-19-lite-single.js");
const ENGINE_NAME = "Stockfish 19 Lite WASM";
const ENGINE_TIMEOUT_MS = 24_000;
const MAX_CONCURRENT_SEARCHES = 2;
let activeSearches = 0;

function parseInfoLine(line: string): UciLine | null {
  const match = line.match(/\bdepth\s+(\d+).*?(?:\bmultipv\s+(\d+)\s+)?\bscore\s+(cp|mate)\s+(-?\d+).*?\bpv\s+(.+)$/);
  if (!match) return null;
  return {
    depth: Number(match[1]),
    rank: Number(match[2] || 1),
    score: { type: match[3] as UciScore["type"], value: Number(match[4]) },
    pv: match[5].trim().split(/\s+/),
  };
}

export function toWhitePerspective(score: UciScore, turn: SideToMove): UciScore {
  return turn === "w" ? score : { ...score, value: -score.value };
}

export function formatEvaluation(score: UciScore): string {
  if (score.type === "mate") return score.value > 0 ? `#${score.value}` : `−#${Math.abs(score.value)}`;
  const pawns = score.value / 100;
  return `${pawns > 0 ? "+" : pawns < 0 ? "−" : ""}${Math.abs(pawns).toFixed(1)}`;
}

export function analyzeWithStockfish(fen: string, depth: number): Promise<{ bestmove: string | null; lines: UciLine[]; engine: string }> {
  return new Promise((resolve, reject) => {
    if (!existsSync(ENGINE_PATH)) {
      reject(new Error("Stockfish WASM files are missing. Reinstall the app assets and retry."));
      return;
    }
    if (activeSearches >= MAX_CONCURRENT_SEARCHES) {
      reject(new Error("Analysis capacity is busy. Please retry in a few seconds."));
      return;
    }
    activeSearches += 1;
    let released = false;
    const releaseSlot = () => {
      if (released) return;
      released = true;
      activeSearches = Math.max(0, activeSearches - 1);
    };
    const child = spawn(process.execPath, [ENGINE_PATH], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    const lines = new Map<number, UciLine>();
    let stdoutBuffer = "";
    let phase: "uci" | "ready" | "search" = "uci";
    let settled = false;
    let bestmove: string | null = null;
    const timer = setTimeout(() => fail(new Error("Stockfish analysis timed out. Please retry with a lower depth.")), ENGINE_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timer);
      releaseSlot();
      child.stdout.removeAllListeners("data");
      child.stderr.removeAllListeners("data");
      child.removeAllListeners("error");
      child.removeAllListeners("close");
      try {
        child.kill("SIGTERM");
      } catch {
        // The process may already have exited.
      }
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const succeed = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({
        bestmove: bestmove && bestmove !== "(none)" && bestmove !== "0000" ? bestmove : null,
        lines: [...lines.values()].sort((a, b) => a.rank - b.rank),
        engine: ENGINE_NAME,
      });
    };
    const send = (command: string) => {
      if (!child.stdin.destroyed) child.stdin.write(`${command}\n`);
    };
    const onLine = (line: string) => {
      const trimmed = line.trim();
      if (phase === "uci" && trimmed === "uciok") {
        phase = "ready";
        send("setoption name Threads value 1");
        send("setoption name Hash value 32");
        send("setoption name MultiPV value 4");
        send("isready");
        return;
      }
      if (phase === "ready" && trimmed === "readyok") {
        phase = "search";
        send(`position fen ${fen}`);
        send(`go depth ${depth}`);
        return;
      }
      if (phase !== "search") return;
      if (trimmed.startsWith("info ")) {
        const info = parseInfoLine(trimmed);
        if (info) {
          const previous = lines.get(info.rank);
          if (!previous || info.depth >= previous.depth) lines.set(info.rank, info);
        }
      }
      if (trimmed.startsWith("bestmove ")) {
        bestmove = trimmed.split(/\s+/)[1] || null;
        succeed();
      }
    };

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdoutBuffer += chunk;
      const split = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = split.pop() ?? "";
      for (const line of split) onLine(line);
    });
    child.stderr.on("data", () => undefined);
    child.on("error", (error) => fail(new Error(`Could not start Stockfish: ${error.message}`)));
    child.on("close", (code) => {
      if (!settled) fail(new Error(`Stockfish stopped before returning a move (exit ${code ?? "unknown"}).`));
    });
    child.stdin.on("error", (error) => fail(new Error(`Stockfish input failed: ${error.message}`)));
    send("uci");
  });
}
