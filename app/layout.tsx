import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  // Chrome voice. Weights constrained to 300 / 400 / 500 — never bold, never italic.
  weight: ["300", "400", "500"],
});

// The serif "where the food lives" — recipe titles, step numerals, stories,
// notes, book pages. Italic (300) carries the handwritten, personal voice.
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Arv — Fra feed til familiearv",
    template: "%s · Arv",
  },
  description:
    "Arv gjør oppskrifter fra Instagram, TikTok og YouTube — og familiens egne — til en trykt, innbundet kokebok. Fra feed til familiearv.",
  applicationName: "Arv",
  metadataBase: new URL("https://arv.kitchen"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Arv",
    // Dark status text over the warm Papir canvas when installed.
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  // Warm Papir canvas — the app ground shows through the browser/PWA UI.
  themeColor: "#FBFAF8",
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
    <html lang="nb" className={`${inter.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
