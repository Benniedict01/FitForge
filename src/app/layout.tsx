import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://chessvision.ai"),
  title: { default: "ChessVision AI — See the board. Find the move.", template: "%s · ChessVision AI" },
  description: "Review a chess screenshot, correct the position, and get genuine Stockfish analysis with a best move, alternatives, evaluation, and principal variation.",
  applicationName: "ChessVision AI",
  robots: { index: true, follow: true },
  openGraph: {
    title: "ChessVision AI — See the board. Find the move.",
    description: "Screenshot-assisted chess position review and real Stockfish analysis.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b100f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${barlow.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
