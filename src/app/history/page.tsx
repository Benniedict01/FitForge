import type { Metadata } from "next";
import { HistoryPage } from "@/components/chess/history-page";

export const metadata: Metadata = { title: "Analysis history" };

export default function HistoryRoute() {
  return <HistoryPage />;
}
