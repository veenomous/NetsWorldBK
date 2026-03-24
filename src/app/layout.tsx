import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  metadataBase: new URL("https://bkgrit.com"),
  title: "BK Grit — Brooklyn Nets Fan HQ",
  description: "The interactive hub for Brooklyn Nets fans. Draft tracker, lottery simulator, hot takes, player stocks, and more. Built for Brooklyn.",
  keywords: ["Brooklyn Nets", "BK Grit", "NBA Draft 2026", "Lottery Simulator", "Nets Fans", "Brooklyn Grit"],
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "BK Grit — Brooklyn Nets Fan HQ",
    description: "Track the draft. Run the lottery. Play GM. Vote on hot takes. Built for Brooklyn.",
    images: ["https://bkgrit.com/api/og?v=2"],
    type: "website",
    siteName: "BK Grit",
  },
  twitter: {
    card: "summary_large_image",
    title: "BK Grit — Brooklyn Nets Fan HQ",
    description: "Track the draft. Run the lottery. Play GM. Vote on hot takes. Built for Brooklyn.",
    images: ["https://bkgrit.com/api/og?v=2"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-bg-primary">
        <Navbar />
        <main className="pt-18 pb-12 px-4 sm:px-6 max-w-6xl mx-auto">
          {children}
        </main>
        <footer className="border-t border-white/[0.04] py-8 px-4 text-center">
          <p className="text-text-secondary text-sm font-semibold">
            BK Grit &mdash; Brooklyn Grit. Nets Fanatic.
          </p>
          <p className="text-text-muted text-xs mt-1">
            Not affiliated with the Brooklyn Nets or NBA. A fan project built for Brooklyn.
          </p>
          <p className="text-text-muted text-[11px] mt-1">
            bkgrit.com
          </p>
        </footer>
      </body>
    </html>
  );
}
