import type { Metadata } from "next";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ text?: string; pct?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const text = params.text || "Hot take from a Nets fan";
  const pct = params.pct || "50";

  const title = `"${text.slice(0, 60)}${text.length > 60 ? "..." : ""}" — BK Grit`;
  const description = `${pct}% of Nets fans agree. Drop your take at BK Grit.`;
  const ogImage = "https://bkgrit.com/api/og?v=2";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
      siteName: "BK Grit",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ShareTakePage({ searchParams }: Props) {
  const params = await searchParams;
  const text = params.text || "";
  const pct = params.pct || "";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="py-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-black gradient-text-brand">Hot Take</h1>
        {text && (
          <p className="text-text-secondary text-sm mt-2 max-w-md mx-auto">
            &ldquo;{text}&rdquo; {pct && <span>— {pct}% agree</span>}
          </p>
        )}
        <p className="text-text-muted text-xs mt-2">Drop your own take at BK Grit</p>
      </div>

      <div className="text-center">
        <Link href="/" className="px-6 py-3 rounded-xl gradient-bg-brand font-bold text-sm text-white hover:opacity-90 transition-opacity inline-block">
          Join the conversation
        </Link>
      </div>
    </div>
  );
}
