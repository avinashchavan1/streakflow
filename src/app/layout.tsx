import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://streakflow-app.netlify.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "StreakFlow — Free Habit Tracker with Streaks, XP & AI Insights",
    template: "%s | StreakFlow",
  },
  description:
    "Free habit tracker with streaks, XP, badges, GitHub-style heatmaps, and weekly AI insights. No ads, open source, calm gamification for daily routines.",
  applicationName: "StreakFlow",
  keywords: [
    "habit tracker",
    "habit tracker app",
    "free habit tracker",
    "streak app",
    "daily habit tracker",
    "habit tracking",
    "build habits",
    "habitica alternative",
    "streaks app alternative",
    "open source habit tracker",
    "habit tracker with ai",
    "gamified habit tracker",
    "habit tracker pwa",
    "habit tracker no ads",
  ],
  authors: [{ name: "StreakFlow" }],
  creator: "StreakFlow",
  publisher: "StreakFlow",
  category: "productivity",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "StreakFlow",
    title: "StreakFlow — Free Habit Tracker with Streaks, XP & AI Insights",
    description:
      "Build daily habits that actually stick. One ring per habit, one minute per check-in. Free forever, no ads, open source.",
    locale: "en_US",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "StreakFlow — habits that actually stick",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "StreakFlow — Free Habit Tracker with Streaks & AI Insights",
    description:
      "One ring per habit, one minute per check-in. Free, no ads, open source.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#100e0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
