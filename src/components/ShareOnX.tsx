"use client";

interface ShareOnXProps {
  text: string;
  url?: string;
  className?: string;
  compact?: boolean;
}

export default function ShareOnX({ text, url, className = "", compact = false }: ShareOnXProps) {
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}${url ? `&url=${encodeURIComponent(url)}` : ""}`;

  return (
    <a
      href={shareUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 transition-all ${
        compact
          ? "text-text-muted hover:text-text-secondary text-xs"
          : "px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 hover:bg-gray-100 hover:border-white/[0.1] text-text-secondary text-xs font-semibold"
      } ${className}`}
    >
      <svg className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      <span>{compact ? "Share" : "Share on X"}</span>
    </a>
  );
}
