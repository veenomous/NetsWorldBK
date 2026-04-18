"use client";

import type { Chapter } from "@/lib/podcasts";
import { formatTimestamp } from "@/lib/youtube";
import { useEpisodePlayer } from "./EpisodePlayerProvider";

interface Props {
  chapters: Chapter[];
  youtubeId: string | null;
}

export default function EpisodeChapters({ chapters, youtubeId }: Props) {
  const { seekTo, hasAudio } = useEpisodePlayer();

  return (
    <section className="border border-black/10 p-4">
      <h2 className="font-display font-black text-xs uppercase tracking-[0.15em] text-text-muted mb-3">
        Chapters
      </h2>
      <ul className="space-y-2">
        {chapters.map((ch, i) => {
          const ts = (
            <span className="text-brand-red text-[10px] font-bold uppercase tracking-wider font-display tabular-nums shrink-0 mt-0.5">
              {formatTimestamp(ch.start_ms)}
            </span>
          );
          const label = (
            <span className="text-text-primary text-xs font-body group-hover:text-brand-red transition-colors">
              {ch.title}
            </span>
          );

          if (hasAudio) {
            return (
              <li key={i}>
                <button
                  onClick={() => seekTo(ch.start_ms / 1000)}
                  className="flex items-start gap-2 group text-left w-full"
                >
                  {ts}
                  {label}
                </button>
              </li>
            );
          }
          if (youtubeId) {
            return (
              <li key={i}>
                <a
                  href={`https://www.youtube.com/watch?v=${youtubeId}&t=${Math.floor(ch.start_ms / 1000)}s`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 group"
                >
                  {ts}
                  {label}
                </a>
              </li>
            );
          }
          return (
            <li key={i} className="flex items-start gap-2">
              {ts}
              {label}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
