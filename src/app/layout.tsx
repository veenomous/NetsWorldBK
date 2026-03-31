import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";

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
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-bg-primary">
        <AuthProvider>
          <Navbar />
          <main>
            {children}
          </main>
          <footer className="bg-black text-white flex flex-col md:flex-row justify-between items-center w-full px-8 py-12 border-t border-white/10">
            <div className="text-[10px] uppercase tracking-[0.2em] font-medium mb-6 md:mb-0">
              © 2026 BK GRIT. NOT AFFILIATED WITH THE BROOKLYN NETS OR NBA.
            </div>
            <div className="flex gap-8">
              <a className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/50 hover:text-brand-red transition-colors" href="#">Terms</a>
              <a className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/50 hover:text-brand-red transition-colors" href="#">Privacy</a>
              <a className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/50 hover:text-brand-red transition-colors" href="#">Contact</a>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
