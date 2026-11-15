import type { Metadata } from "next";
import { SettingsPage } from "@/components/chess/settings-page";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsRoute() {
  return <SettingsPage />;
}
