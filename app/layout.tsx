import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  // House style constrains weights to 300 / 400 / 500. No bold, no italics.
  weight: ["300", "400", "500"],
});

// Serif for book surfaces only (the deliberate quiet-app / rich-book contrast).
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Arv — From scroll to shelf",
    template: "%s · Arv",
  },
  description:
    "A source-to-print system for recipe books. Capture recipes from social media and your own kitchen, and turn them into a printed hardcover.",
  applicationName: "Arv",
  metadataBase: new URL("https://arv.kitchen"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Arv",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Draw under the notch/home indicator so chrome can use safe-area insets.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
