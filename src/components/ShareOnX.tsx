"use client";

import { useState } from "react";

interface ShareOnXProps {
  text: string;
  url?: string;
  className?: string;
  compact?: boolean;
}

export default function ShareOnX({ text, url, className = "", compact = false }: ShareOnXProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullText = url ? `${text} ${url}` : text;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}${url ? `&url=${encodeURIComponent(url)}` : ""}`;

  function handleCopy() {
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 transition-all ${
          compact
            ? "text-black/25 hover:text-black/50 text-xs font-bold"
            : "px-4 py-2 bg-black text-white text-[11px] font-black uppercase tracking-wider hover:bg-gray-800"
        }`}
      >
        <svg className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span>Share</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 z-50 w-52 bg-white border border-gray-200 shadow-xl">
            <button
              onClick={handleCopy}
              className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100"
            >
              <svg className="w-4 h-4 text-black/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-black/30" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </a>
          </div>
        </>
      )}
    </div>
  );
}
