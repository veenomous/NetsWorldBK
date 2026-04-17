"use client";

import { useState } from "react";
import type { HotMoment } from "@/lib/podcasts";
import { formatTimestamp } from "@/lib/youtube";

interface Props {
  episodeId: string;
  showName: string;
  showSlug: string;
  episodeSlug: string;
  youtubeId: string | null;
  moments: HotMoment[];
  tweetThread: string;
}

function fireBar(level: number) {
  const accent = level >= 4 ? "bg-brand-red" : level >= 3 ? "bg-accent-blue" : "bg-accent-green";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={`h-2 w-3 ${i <= level ? accent : "bg-black/10"}`} />
      ))}
    </div>
  );
}

export default function EpisodeHotMoments({
  episodeId,
  showName,
  youtubeId,
  moments,
  tweetThread,
}: Props) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedThread, setCopiedThread] = useState(false);

  function copyTweet(moment: HotMoment, idx: number) {
    const ytLink = youtubeId
      ? `https://www.youtube.com/watch?v=${youtubeId}&t=${Math.floor(moment.timestamp_ms / 1000)}s`
      : "";
    const tweet = `"${moment.quote}"\n\n— ${showName} [${formatTimestamp(moment.timestamp_ms)}]${ytLink ? `\n\n${ytLink}` : ""}`;
    navigator.clipboard.writeText(tweet);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function copyThread() {
    navigator.clipboard.writeText(tweetThread);
    setCopiedThread(true);
    setTimeout(() => setCopiedThread(false), 2000);
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-black text-xs uppercase tracking-[0.15em] text-text-muted">
          <span className="text-brand-red">Hot</span> Moments
        </h2>
        {tweetThread && (
          <button
            onClick={copyThread}
            className="text-[10px] font-display font-bold uppercase tracking-wider text-brand-red hover:underline flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            {copiedThread ? "Copied!" : "Copy Tweet Thread"}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {moments.map((m, i) => {
          const cardUrl = `/api/podcasts/episodes/${episodeId}/card/${i}`;
          const ytLink = youtubeId
            ? `https://www.youtube.com/watch?v=${youtubeId}&t=${Math.floor(m.timestamp_ms / 1000)}s`
            : null;
          return (
            <article key={i} className="border border-black/10 p-5">
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-display font-bold uppercase tracking-wider bg-black text-white px-2 py-0.5">
                    {m.topic}
                  </span>
                  {ytLink ? (
                    <a
                      href={ytLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-red text-[11px] font-body font-bold tabular-nums hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                      {formatTimestamp(m.timestamp_ms)}
                    </a>
                  ) : (
                    <span className="text-text-muted text-[11px] font-body font-bold tabular-nums">
                      {formatTimestamp(m.timestamp_ms)}
                    </span>
                  )}
                </div>
                {fireBar(m.fire_level)}
              </div>
              <blockquote className="border-l-4 border-brand-red pl-4 my-3">
                <p className="text-text-primary font-body text-sm sm:text-base leading-relaxed italic">
                  &ldquo;{m.quote}&rdquo;
                </p>
              </blockquote>
              {m.context && (
                <p className="text-text-muted text-xs font-body leading-relaxed mt-2">{m.context}</p>
              )}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <button
                  onClick={() => copyTweet(m, i)}
                  className="bg-black text-white text-[10px] font-display font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-brand-red transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  {copiedIdx === i ? "Copied!" : "Copy Tweet"}
                </button>
                <a
                  href={cardUrl}
                  download={`bkgrit-clip-${i + 1}.png`}
                  className="bg-bg-surface text-text-primary text-[10px] font-display font-bold uppercase tracking-wider px-3 py-1.5 hover:bg-black hover:text-white transition-colors flex items-center gap-1 border border-black/10"
                >
                  <span className="material-symbols-outlined text-sm">image</span>
                  Download Card
                </a>
                <a
                  href={cardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted text-[10px] font-body hover:text-brand-red"
                >
                  Preview →
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
