"use client";

import { useState } from "react";

interface ShareButtonProps {
  text: string;
  url?: string;
  hashtags?: string;
  size?: "sm" | "md";
}

function buildTweetUrl(text: string, url: string, hashtags: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;
}

async function shareToTwitter(text: string, url: string, hashtags: string) {
  const tweetUrl = buildTweetUrl(text, url, hashtags);

  // Try native Web Share API first (mobile / supported browsers)
  if (navigator.share) {
    try {
      await navigator.share({ text: `${text} #${hashtags.split(",")[0]}`, url });
      return "shared";
    } catch {
      // User cancelled or not supported — fall through to link
    }
  }

  // Fallback: open Twitter in new tab (not popup)
  window.open(tweetUrl, "_blank", "noopener,noreferrer");
  return "opened";
}

export default function ShareButton({ text, url, hashtags = "BKGrit,Nets,NBADraft", size = "sm" }: ShareButtonProps) {
  const [shared, setShared] = useState(false);
  const shareUrl = url || "https://bkgrit.com?ref=share";

  const handleShare = async () => {
    await shareToTwitter(text, shareUrl, hashtags);
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all hover:scale-105 cursor-pointer
        ${shared
          ? "bg-accent-green/15 text-accent-green"
          : size === "sm"
            ? "px-3 py-1.5 text-[11px] bg-white/[0.06] text-text-secondary hover:bg-[#1d9bf0]/15 hover:text-[#1d9bf0]"
            : "px-4 py-2 text-[13px] bg-[#1d9bf0]/15 text-[#1d9bf0] hover:bg-[#1d9bf0]/25"
        } ${size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-[13px]"}`}
    >
      {shared ? (
        <>&#10003; Shared</>
      ) : (
        <>
          <XIcon size={size === "sm" ? 12 : 16} />
          Share
        </>
      )}
    </button>
  );
}

export function ShareLotteryResult({ pick }: { pick: number }) {
  const [shared, setShared] = useState(false);

  const text = pick === 1
    ? "I just got the Nets the #1 PICK in the lottery sim!"
    : pick <= 3
      ? `Nets got the #${pick} pick in my lottery sim! Top 3 baby!`
      : `Nets landed at #${pick} in my lottery sim.`;

  const sharePageUrl = `https://bkgrit.com/share/lottery?pick=${pick}`;

  const handleShare = async () => {
    await shareToTwitter(text, sharePageUrl, "BKGrit,Nets,NBADraft");
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all hover:scale-105 px-5 py-2.5 text-[13px] cursor-pointer ${
        shared ? "bg-accent-green text-white" : "bg-[#1d9bf0] text-white hover:bg-[#1a8cd8]"
      }`}
    >
      {shared ? (
        <>&#10003; Shared!</>
      ) : (
        <>
          <XIcon size={16} />
          Share on X
        </>
      )}
    </button>
  );
}

export function ShareGMResult({
  score,
  grade,
  player,
  percentile,
}: {
  score: number;
  grade: string;
  player: string;
  percentile: number;
}) {
  const [shared, setShared] = useState(false);

  const text = `My BK Grit GM Score: ${score}/100 (Grade: ${grade}) — I drafted ${player} for the Nets! Better than ${percentile}% of fans.`;
  const sharePageUrl = `https://bkgrit.com/share/gm?score=${score}&grade=${encodeURIComponent(grade)}&player=${encodeURIComponent(player)}&percentile=${percentile}`;

  const handleShare = async () => {
    await shareToTwitter(text, sharePageUrl, "BKGrit,Nets,NBADraft");
    setShared(true);
    setTimeout(() => setShared(false), 3000);
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all hover:scale-105 px-5 py-2.5 text-[13px] cursor-pointer ${
        shared ? "bg-accent-green text-white" : "bg-[#1d9bf0] text-white hover:bg-[#1a8cd8]"
      }`}
    >
      {shared ? (
        <>&#10003; Shared!</>
      ) : (
        <>
          <XIcon size={16} />
          Share on X
        </>
      )}
    </button>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
