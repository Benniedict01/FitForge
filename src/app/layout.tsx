import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { WorkoutProvider } from "@/components/workout/workout-provider";
import "./globals.css";

const dmSans = localFont({
  src: "../../public/fonts/dm-sans-variable.ttf",
  variable: "--font-dm-sans",
  display: "swap",
  weight: "100 1000",
});
const barlow = localFont({
  src: "../../public/fonts/barlow-condensed-bold.ttf",
  variable: "--font-display",
  display: "swap",
  weight: "700",
});

export const metadata: Metadata = {
  title: "FitForge — Build Your Workout. Build Yourself.",
  description:
    "Your goals. Your equipment. Your next great workout. Build a personalized training session in five simple steps with FitForge.",
  applicationName: "FitForge",
  robots: { index: true, follow: true },
  openGraph: {
    title: "FitForge — Built for your better.",
    description: "An intelligent workout planner that meets you where you are.",
    type: "website",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111312",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${barlow.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <WorkoutProvider>
          <Header />
          {children}
          <Footer />
        </WorkoutProvider>
      </body>
    </html>
  );
}
