import Link from "next/link";
import { cn } from "@/lib/utils";

export function ForgeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 40" fill="none" className={cn("forge-mark", className)} aria-hidden="true">
      <path d="M8 4h23l-4 8H14l-3 6h14l-4 8H8L3 36H0L8 4Z" fill="currentColor" />
      <path d="m26 19 8-3-10 20H12l5-10h8l1-7Z" fill="currentColor" opacity=".55" />
    </svg>
  );
}
export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" aria-label="FitForge home" className={cn("logo", className)}>
      <ForgeMark />
      <span>
        FitForge<span className="logo-period">.</span>
      </span>
    </Link>
  );
}
