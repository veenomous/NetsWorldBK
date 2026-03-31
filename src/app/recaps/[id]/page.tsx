"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CommentSection from "@/components/CommentSection";
import ShareOnX from "@/components/ShareOnX";
import Link from "next/link";

interface Recap {
  id: string;
  opponent: string;
  game_date: string;
  nets_score: number;
  opponent_score: number;
  mvp: string;
  rating: number;
  headline: string;
  summary: string;
  vibe: string;
  created_at: string;
  user: { x_handle: string; x_name: string; x_avatar: string | null };
}

const vibeLabels: Record<string, { label: string; emoji: string }> = {
  hyped: { label: "Hyped", emoji: "🔥" },
  solid: { label: "Solid W", emoji: "💪" },
  meh: { label: "Meh", emoji: "😐" },
  pain: { label: "Pain", emoji: "😭" },
  tank: { label: "Tank Szn", emoji: "🪖" },
};

export default function RecapDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const router = useRouter();
  const currentHandle = (session?.user as { xHandle?: string })?.xHandle || null;

  const [recap, setRecap] = useState<Recap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("game_recaps")
        .select("*, user:users(x_handle, x_name, x_avatar)")
        .eq("id", id)
        .single();
      if (data) setRecap(data as unknown as Recap);
      setLoading(false);
    }
    load();
  }, [id]);

  const isOwner = recap && currentHandle === recap.user.x_handle;

  async function handleDelete() {
    if (!confirm("Delete this recap?")) return;
    await supabase.from("game_recaps").delete().eq("id", id);
    router.push("/recaps");
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse-soft" />
        <div className="h-6 w-full bg-gray-50 rounded animate-pulse-soft" />
        <div className="h-40 w-full bg-gray-50 rounded animate-pulse-soft" />
      </div>
    );
  }

  if (!recap) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted text-lg">Recap not found.</p>
        <Link href="/recaps" className="text-brand-orange text-sm font-semibold mt-2 inline-block hover:underline">
          Back to Recaps
        </Link>
      </div>
    );
  }

  const won = recap.nets_score > recap.opponent_score;
  const v = vibeLabels[recap.vibe] || { label: "Neutral", emoji: "🏀" };
  const dateStr = new Date(recap.game_date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/recaps" className="text-text-muted text-sm hover:text-brand-orange transition-colors">
        &larr; Back to Recaps
      </Link>

      <article className="card p-6 sm:p-8">
        {/* Score hero */}
        <div className={`rounded-xl p-5 mb-6 text-center ${won ? "bg-accent-green/5 border border-accent-green/15" : "bg-accent-red/5 border border-accent-red/15"}`}>
          <p className="text-text-muted text-xs uppercase tracking-wider mb-2">{dateStr}</p>
          <div className="flex items-center justify-center gap-4">
            <div>
              <p className="text-sm font-black text-brand-orange">BKN</p>
              <p className={`text-4xl font-black ${won ? "text-accent-green" : "text-text-primary"}`}>{recap.nets_score}</p>
            </div>
            <p className="text-text-muted text-2xl font-light">—</p>
            <div>
              <p className="text-sm font-black text-text-secondary">{recap.opponent}</p>
              <p className={`text-4xl font-black ${!won ? "text-accent-red" : "text-text-primary"}`}>{recap.opponent_score}</p>
            </div>
          </div>
          <p className="mt-3 text-2xl">{v.emoji} <span className="text-sm font-bold text-text-secondary">{v.label}</span></p>
        </div>

        {/* Headline */}
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl sm:text-3xl font-black text-text-primary leading-tight">
            {recap.headline}
          </h1>
          {isOwner && (
            <button onClick={handleDelete} className="text-text-muted text-xs font-semibold hover:text-accent-red transition-colors shrink-0 ml-4">
              Delete
            </button>
          )}
        </div>

        {/* MVP + Rating */}
        <div className="flex flex-wrap items-center gap-3 mb-5 pb-5 border-b border-gray-200">
          <span className="tag tag-gold text-xs">MVP: {recap.mvp}</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${i < recap.rating ? "bg-brand-orange" : "bg-gray-200"}`} />
            ))}
            <span className="text-text-muted text-xs ml-1">{recap.rating}/10</span>
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center gap-3 mb-5">
          {recap.user.x_avatar ? (
            <img src={recap.user.x_avatar} alt="" className="w-10 h-10 rounded-full border border-gray-200" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-sm font-bold">
              {recap.user.x_handle[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-text-primary">{recap.user.x_name}</p>
            <p className="text-xs text-text-muted">@{recap.user.x_handle}</p>
          </div>
        </div>

        {/* Body */}
        <div className="text-text-secondary text-[15px] leading-relaxed whitespace-pre-wrap mb-6">
          {recap.summary}
        </div>

        {/* Share */}
        <div className="pt-5 border-t border-gray-200">
          <ShareOnX
            text={`BKN ${recap.nets_score} - ${recap.opponent} ${recap.opponent_score} ${v.emoji} MVP: ${recap.mvp} — "${recap.headline}" by @${recap.user.x_handle}`}
            url={`https://bkgrit.com/recaps/${recap.id}`}
          />
        </div>
      </article>

      <CommentSection page={`recap-${recap.id}`} />
    </div>
  );
}
