import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const standaloneDir = resolve(".next/standalone");
const nextOutputDir = resolve(standaloneDir, ".next");

await mkdir(nextOutputDir, { recursive: true });
await Promise.all([
  cp(resolve("public"), resolve(standaloneDir, "public"), { recursive: true }),
  cp(resolve(".next/static"), resolve(nextOutputDir, "static"), { recursive: true }),
]);

process.env.HOSTNAME = "0.0.0.0";
await import("../.next/standalone/server.js");
