"use client";

import { useState } from "react";
import { formatTimestamp } from "@/lib/youtube";
import { useEpisodePlayer } from "./EpisodePlayerProvider";

interface Props {
  segments: { text: string; offsetMs: number; durationMs: number }[];
  youtubeId: string | null;
}

export default function EpisodeTranscript({ segments, youtubeId }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { seekTo, hasAudio } = useEpisodePlayer();

  const filtered = query
    ? segments.filter((s) => s.text.toLowerCase().includes(query.toLowerCase()))
    : segments;

  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="w-full border border-dashed border-black/15 bg-bg-surface/40 p-3 flex items-center justify-between hover:border-brand-red/30 transition-colors group"
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-text-muted group-hover:text-brand-red transition-colors">subject</span>
          <span className="font-display font-bold text-[11px] uppercase tracking-[0.15em] text-text-muted group-hover:text-brand-red transition-colors">
            Searchable Transcript · For Reference
          </span>
        </span>
        <span className="material-symbols-outlined text-text-muted group-hover:text-brand-red transition-colors text-base">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>

      {open && (
        <div className="border border-t-0 border-black/10 p-4 space-y-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transcript..."
            className="w-full border border-black/10 px-3 py-2 text-xs font-body focus:outline-none focus:border-brand-red/50"
          />
          <div className="max-h-[500px] overflow-y-auto space-y-1">
            {filtered.slice(0, 500).map((s, i) => (
              <div key={i} className="flex gap-3 text-xs">
                {hasAudio ? (
                  <button
                    onClick={() => seekTo(s.offsetMs / 1000)}
                    className="text-brand-red font-body font-bold tabular-nums shrink-0 w-12 text-left hover:underline"
                  >
                    {formatTimestamp(s.offsetMs)}
                  </button>
                ) : youtubeId ? (
                  <a
                    href={`https://www.youtube.com/watch?v=${youtubeId}&t=${Math.floor(s.offsetMs / 1000)}s`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-red font-body font-bold tabular-nums shrink-0 w-12 hover:underline"
                  >
                    {formatTimestamp(s.offsetMs)}
                  </a>
                ) : (
                  <span className="text-text-muted font-body font-bold tabular-nums shrink-0 w-12">
                    {formatTimestamp(s.offsetMs)}
                  </span>
                )}
                <span className="text-text-primary font-body leading-relaxed">{s.text}</span>
              </div>
            ))}
            {filtered.length > 500 && (
              <p className="text-text-muted text-[10px] font-body italic">
                Showing first 500 of {filtered.length} matching segments. Refine search to see more.
              </p>
            )}
            {filtered.length === 0 && (
              <p className="text-text-muted text-xs font-body italic">No segments match.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
