import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "NetsWorld — Brooklyn Nets Draft HQ 2026",
  description: "Live draft pick tracker, lottery simulator, GM mode, and more. The ultimate interactive hub for Brooklyn Nets fans.",
  keywords: ["Brooklyn Nets", "NBA Draft 2026", "Lottery Simulator", "Draft Pick Tracker", "Nets Fans"],
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
      <body className="antialiased min-h-screen bg-nets-black">
        <Navbar />
        <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {children}
        </main>
        <footer className="border-t border-white/5 py-8 px-4 text-center">
          <p className="text-nets-silver text-sm">
            NetsWorld &mdash; Built for Brooklyn.
          </p>
          <p className="text-nets-silver/50 text-xs mt-1">
            Not affiliated with the Brooklyn Nets or NBA. Fan project.
          </p>
        </footer>
      </body>
    </html>
  );
}
