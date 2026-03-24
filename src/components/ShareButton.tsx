"use client";

interface ShareButtonProps {
  text: string;
  url?: string;
  hashtags?: string;
  size?: "sm" | "md";
}

function openTwitterPopup(tweetUrl: string) {
  window.open(tweetUrl, "twitter-share", "width=550,height=420,menubar=no,toolbar=no");
}

export default function ShareButton({ text, url, hashtags = "BKGrit,Nets,NBADraft", size = "sm" }: ShareButtonProps) {
  const shareUrl = url || "https://bkgrit.com?ref=share";
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}&hashtags=${encodeURIComponent(hashtags)}`;

  return (
    <button
      onClick={() => openTwitterPopup(tweetUrl)}
      className={`inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all hover:scale-105 cursor-pointer
        ${size === "sm"
          ? "px-3 py-1.5 text-[11px] bg-white/[0.06] text-text-secondary hover:bg-[#1d9bf0]/15 hover:text-[#1d9bf0]"
          : "px-4 py-2 text-[13px] bg-[#1d9bf0]/15 text-[#1d9bf0] hover:bg-[#1d9bf0]/25"
        }`}
    >
      <XIcon size={size === "sm" ? 12 : 16} />
      Share
    </button>
  );
}

export function ShareLotteryResult({ pick }: { pick: number }) {
  const text = pick === 1
    ? "I just got the Nets the #1 PICK in the lottery sim!"
    : pick <= 3
      ? `Nets got the #${pick} pick in my lottery sim! Top 3 baby!`
      : `Nets landed at #${pick} in my lottery sim.`;

  const sharePageUrl = `https://bkgrit.com/share/lottery?pick=${pick}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(sharePageUrl)}&hashtags=${encodeURIComponent("BKGrit,Nets,NBADraft")}`;

  return (
    <button
      onClick={() => openTwitterPopup(tweetUrl)}
      className="inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all hover:scale-105 px-5 py-2.5 text-[13px] bg-[#1d9bf0] text-white hover:bg-[#1a8cd8] cursor-pointer"
    >
      <XIcon size={16} />
      Share on X
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
  const text = `My BK Grit GM Score: ${score}/100 (Grade: ${grade}) — I drafted ${player} for the Nets! Better than ${percentile}% of fans.`;
  const sharePageUrl = `https://bkgrit.com/share/gm?score=${score}&grade=${encodeURIComponent(grade)}&player=${encodeURIComponent(player)}&percentile=${percentile}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(sharePageUrl)}&hashtags=${encodeURIComponent("BKGrit,Nets,NBADraft")}`;

  return (
    <button
      onClick={() => openTwitterPopup(tweetUrl)}
      className="inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all hover:scale-105 px-5 py-2.5 text-[13px] bg-[#1d9bf0] text-white hover:bg-[#1a8cd8] cursor-pointer"
    >
      <XIcon size={16} />
      Share on X
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
