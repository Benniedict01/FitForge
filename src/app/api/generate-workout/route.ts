import { NextResponse } from "next/server";
import { preferencesSchema } from "@/lib/workouts/schema";
import { createWorkout } from "@/lib/server/workout-service";
import { checkRateLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const MAX_BYTES = 4_096;

async function readBoundedJson(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_BYTES) throw new Error("TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID_JSON");
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BYTES) {
        await reader.cancel();
        throw new Error("TOO_LARGE");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json(
      { error: "Please send your workout preferences as JSON." },
      { status: 415 },
    );
  }
  // In production, configure the hosting proxy to overwrite forwarded IP headers.
  const ip = (request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown").slice(
    0,
    100,
  );
  const limit = checkRateLimit(ip);
  if (!limit.allowed)
    return NextResponse.json(
      { error: "A quick breather. Please try again in a minute." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );

  let body: unknown;
  try {
    body = await readBoundedJson(request);
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === "TOO_LARGE";
    return NextResponse.json(
      {
        error: tooLarge
          ? "The request is too large."
          : "That request isn't valid JSON. Please try again.",
      },
      { status: tooLarge ? 413 : 400 },
    );
  }
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Please choose a valid option for each of the five steps.",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  try {
    const workout = await createWorkout(parsed.data);
    return NextResponse.json(
      { workout },
      { headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } },
    );
  } catch {
    return NextResponse.json(
      { error: "We couldn't build that session just now. Please try again." },
      { status: 503 },
    );
  }
}
