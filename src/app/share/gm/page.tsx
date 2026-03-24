import type { Metadata } from "next";
import GMMode from "@/components/GMMode";
import Link from "next/link";

type Props = {
  searchParams: Promise<{ score?: string; grade?: string; player?: string; percentile?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const score = params.score || "75";
  const grade = params.grade || "B+";
  const player = params.player || "";
  const percentile = params.percentile || "65";

  const title = `GM Score: ${score}/100 (${grade}) — BK Grit`;
  const description = player
    ? `I drafted ${player} for the Nets and scored ${score}/100 — better than ${percentile}% of fans. Think you can do better?`
    : `I scored ${score}/100 as Nets GM — better than ${percentile}% of fans. Play the War Room at BK Grit.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/api/og?type=gm&score=${score}&grade=${grade}&player=${encodeURIComponent(player)}&percentile=${percentile}`],
      type: "website",
      siteName: "BK Grit",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og?type=gm&score=${score}&grade=${grade}&player=${encodeURIComponent(player)}&percentile=${percentile}`],
    },
  };
}

export default async function ShareGMPage({ searchParams }: Props) {
  const params = await searchParams;
  const score = params.score || "75";
  const grade = params.grade || "B+";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="py-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-black gradient-text-brand">War Room Result</h1>
        <p className="text-text-secondary text-sm mt-1">
          Someone scored <span className="font-bold text-white">{score}/100</span> (Grade: {grade}). Can you beat it?
        </p>
      </div>

      <div className="card p-5 sm:p-6">
        <GMMode />
      </div>

      <div className="text-center">
        <Link href="/" className="text-sm text-text-muted hover:text-white transition-colors">
          &larr; Back to BK Grit
        </Link>
      </div>
    </div>
  );
}
