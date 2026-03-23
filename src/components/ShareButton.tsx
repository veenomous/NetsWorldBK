"use client";

interface ShareButtonProps {
  text: string;
  url?: string;
  hashtags?: string;
  size?: "sm" | "md";
}

export default function ShareButton({ text, url = "https://bkgrit.com", hashtags = "BKGrit,Nets,NBADraft", size = "sm" }: ShareButtonProps) {
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all hover:scale-105
        ${size === "sm"
          ? "px-3 py-1.5 text-[11px] bg-white/[0.06] text-text-secondary hover:bg-[#1d9bf0]/15 hover:text-[#1d9bf0]"
          : "px-4 py-2 text-[13px] bg-[#1d9bf0]/15 text-[#1d9bf0] hover:bg-[#1d9bf0]/25"
        }`}
    >
      <svg className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      Share
    </a>
  );
}

export function ShareResultButton({ text, size = "md" }: { text: string; size?: "sm" | "md" }) {
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + "\n\nTry it yourself at bkgrit.com")}&hashtags=${encodeURIComponent("BKGrit,Nets,NBADraft")}`;

  return (
    <a
      href={tweetUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all hover:scale-105
        ${size === "sm"
          ? "px-4 py-2 text-[12px]"
          : "px-5 py-2.5 text-[13px]"
        } bg-[#1d9bf0] text-white hover:bg-[#1a8cd8]`}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      Share on X
    </a>
  );
}
