"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Space {
  id: string;
  title: string;
  opponent: string | null;
  date: string;
  duration_mins: number;
  status: string;
  speaker_count: number;
  summary: string | null;
  created_at: string;
}

export default function SpacesArchive() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("spaces")
      .select("id, title, opponent, date, duration_mins, status, speaker_count, summary, created_at")
      .order("date", { ascending: false })
      .then(({ data }) => {
        if (data) setSpaces(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-2 text-xs font-body mb-4">
            <Link href="/" className="text-white/40 hover:text-white transition-colors">&larr; Wiki</Link>
          </nav>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-brand-red text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight">
              <span className="text-brand-red">Spaces</span> Archive
            </h1>
          </div>
          <p className="text-white/40 text-sm font-body">Post-game fan reactions and discussions. Listen, relive, debate.</p>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-bg-surface animate-pulse-soft" />)}
          </div>
        ) : spaces.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-text-muted/30 text-5xl">mic_off</span>
            <p className="text-text-muted text-sm font-body mt-4">No Spaces archived yet. The first one is coming soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {spaces.map((space) => (
              <Link key={space.id} href={`/spaces/${space.id}`}
                className="block border border-black/10 p-5 hover:border-brand-red/30 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-text-muted text-[10px] tracking-[0.15em] uppercase font-bold">{space.date}</span>
                      {space.opponent && (
                        <>
                          <span className="text-text-muted text-[10px]">·</span>
                          <span className="text-text-muted text-[10px] uppercase font-bold">{space.opponent}</span>
                        </>
                      )}
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                        space.status === "ready" ? "bg-[rgba(22,163,74,0.1)] text-[#16a34a]" :
                        space.status === "processing" || space.status === "transcribed" ? "bg-[rgba(0,71,171,0.1)] text-[#0047AB]" :
                        "bg-[rgba(228,60,62,0.1)] text-[#E43C3E]"
                      }`}>
                        {space.status}
                      </span>
                    </div>
                    <p className="font-display font-black text-base uppercase tracking-tight text-text-primary group-hover:text-brand-red transition-colors">
                      {space.title}
                    </p>
                    {space.summary && (
                      <p className="text-text-muted text-xs font-body mt-1 line-clamp-2">{space.summary}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-text-muted text-[10px]">
                      <span>{space.duration_mins}min</span>
                      <span>{space.speaker_count} speakers</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-text-muted/30 group-hover:text-brand-red text-lg transition-colors mt-1">play_circle</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
