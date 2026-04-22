import type { Metadata } from "next";
import { Oswald, Libre_Baskerville } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre-baskerville",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Consciousness may be more than the brain's output — Big Think",
  description:
    "A new framework suggests that bursts of neural chaos could be the fingerprints of a conscious mind at work. Pretext.js layout experiment.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${oswald.variable} ${libreBaskerville.variable}`}>
      <body>{children}</body>
    </html>
  );
}
