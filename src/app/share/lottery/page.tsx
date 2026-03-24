import type { Metadata } from "next";
import LotterySimulator from "@/components/LotterySimulator";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ pick?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const pick = params.pick || "3";
  const pickNum = parseInt(pick);

  const title = pickNum === 1
    ? "I got the Nets the #1 PICK! — BK Grit"
    : pickNum <= 3
      ? `Nets got the #${pick} pick in my lottery sim! — BK Grit`
      : `Nets landed at #${pick} in the lottery — BK Grit`;

  const description = `I just ran the NBA Draft Lottery on BK Grit and the Nets got the #${pick} pick. Can you do better? Try the simulator now.`;

  const ogImage = `https://bkgrit.com/api/og?v=2&type=lottery&pick=${pick}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `Nets got the #${pick} pick`,
        },
      ],
      type: "website",
      siteName: "BK Grit",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    other: {
      "og:image:type": "image/png",
    },
  };
}

export default async function ShareLotteryPage({ searchParams }: Props) {
  const params = await searchParams;
  const pick = params.pick || "3";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="py-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-black gradient-text-brand">Lottery Result</h1>
        <p className="text-text-secondary text-sm mt-1">
          Someone got the Nets the <span className="font-bold text-white">#{pick}</span> pick. Can you beat it?
        </p>
      </div>

      <LotterySimulator />

      <div className="text-center">
        <Link href="/" className="text-sm text-text-muted hover:text-white transition-colors">
          &larr; Back to BK Grit
        </Link>
      </div>
    </div>
  );
}
