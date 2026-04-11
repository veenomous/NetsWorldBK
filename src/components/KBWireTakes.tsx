"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface WireTake {
  id: string;
  text: string;
  author: string;
  agrees: number;
  disagrees: number;
  tag: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function KBWireTakes({ keywords }: { keywords: string[] }) {
  const [takes, setTakes] = useState<WireTake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTakes() {
      // Fetch recent Wire posts and filter client-side for keyword matches
      const { data } = await supabase
        .from("hot_takes")
        .select("id, text, author, agrees, disagrees, tag, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        const lowerKeywords = keywords.map((k) => k.toLowerCase());
        const matched = data.filter((take) => {
          const text = take.text.toLowerCase();
          return lowerKeywords.some((kw) => text.includes(kw));
        });
        // Sort by engagement (agrees + disagrees) then recency
        matched.sort((a, b) => (b.agrees + b.disagrees) - (a.agrees + a.disagrees));
        setTakes(matched.slice(0, 5));
      }
      setLoading(false);
    }
    fetchTakes();
  }, [keywords]);

  if (loading) return null;
  if (takes.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-black/10">
      <h3 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-4 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
          forum
        </span>
        Fan Takes from The Wire
      </h3>
      <div className="space-y-3">
        {takes.map((take) => (
          <div key={take.id} className="border border-black/5 p-3">
            <p className="text-text-primary text-sm font-body leading-relaxed">
              &ldquo;{take.text.length > 200 ? take.text.slice(0, 200) + "..." : take.text}&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-text-muted text-[10px] font-bold">@{take.author}</span>
              <span className="text-text-muted text-[10px]">{timeAgo(take.created_at)} ago</span>
              <span className="text-accent-green text-[10px] font-bold">{take.agrees} agrees</span>
              {take.disagrees > 0 && (
                <span className="text-brand-red text-[10px] font-bold">{take.disagrees} disagrees</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <Link href="/wire" className="text-xs text-brand-red hover:underline font-body mt-3 inline-block">
        See all takes on The Wire &rarr;
      </Link>
    </div>
  );
}
