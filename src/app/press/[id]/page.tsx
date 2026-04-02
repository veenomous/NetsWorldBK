import ArticleDetail from "@/components/ArticleDetail";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU"
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;

  let type: "article" | "recap" = "article";
  let realId = id;

  if (id.startsWith("recap-")) {
    type = "recap";
    realId = id.replace("recap-", "");
  } else if (id.startsWith("article-")) {
    realId = id.replace("article-", "");
  }

  let title = "BK Grit — Brooklyn Nets Fan HQ";
  let description = "Read more on BK Grit.";
  let image = "https://bkgrit.com/api/og?v=3";

  if (type === "recap") {
    const { data } = await supabase
      .from("game_recaps")
      .select("headline, summary, image_url, opponent, nets_score, opponent_score, user:users(x_handle)")
      .eq("id", realId)
      .single();

    if (data) {
      const r = data as unknown as { headline: string; summary: string; image_url: string | null; opponent: string; nets_score: number; opponent_score: number };
      title = `${r.headline} — BK Grit`;
      description = `BKN ${r.nets_score} - ${r.opponent} ${r.opponent_score}. ${r.summary.slice(0, 150)}`;
      if (r.image_url) image = r.image_url;
    }
  } else {
    const { data } = await supabase
      .from("articles")
      .select("title, body, image_url, tag")
      .eq("id", realId)
      .single();

    if (data) {
      const a = data as unknown as { title: string; body: string; image_url: string | null; tag: string };
      title = `${a.title} — BK Grit`;
      description = a.body.slice(0, 200);
      if (a.image_url) image = a.image_url;
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      type: "article",
      siteName: "BK Grit",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleDetail id={id} />;
}
