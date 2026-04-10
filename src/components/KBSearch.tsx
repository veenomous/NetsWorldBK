"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface SearchResult {
  title: string;
  category: string;
  slug: string;
  confidence: "high" | "medium" | "low";
  snippet: string;
  relevance: number;
}

const confBg = {
  high: "bg-[rgba(22,163,74,0.15)] text-[#16a34a]",
  medium: "bg-[rgba(217,119,6,0.15)] text-[#d97706]",
  low: "bg-[rgba(228,60,62,0.15)] text-[#E43C3E]",
};

export default function KBSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Position the dropdown relative to the input
  function updatePosition() {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/kb/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
        updatePosition();
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => updatePosition();
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [isOpen]);

  const dropdown = isOpen && (results.length > 0 || (query.length >= 2 && !isLoading)) ? (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 9999,
      }}
    >
      {results.length > 0 ? (
        <div className="bg-[#111] border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.6)] max-h-[50vh] overflow-y-auto">
          {results.map((r) => (
            <Link
              key={`${r.category}/${r.slug}`}
              href={`/kb/${r.category}/${r.slug}`}
              onClick={() => { setIsOpen(false); setQuery(""); }}
              className="block px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/8 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-[10px] tracking-[0.12em] uppercase font-bold font-body">
                  {r.category.replace("-", " ")}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${confBg[r.confidence]}`}>
                  {r.confidence}
                </span>
              </div>
              <p className="font-display font-bold text-[13px] text-white group-hover:text-[#E43C3E] transition-colors uppercase tracking-tight mt-1 leading-tight">
                {r.title}
              </p>
              {r.snippet && r.snippet !== r.title && (
                <p className="text-white/25 text-[11px] font-body mt-1 leading-snug" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {r.snippet}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-[#111] border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.6)] px-4 py-5 text-center">
          <p className="text-white/30 text-sm font-body">No articles found for &ldquo;{query}&rdquo;</p>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <div className="relative w-full max-w-lg">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-lg">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) { setIsOpen(true); updatePosition(); } }}
            placeholder="Search the wiki..."
            className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 pl-10 pr-4 py-2.5 font-body text-sm focus:outline-none focus:border-[#E43C3E]/50 transition-colors"
          />
          {isLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm animate-pulse-soft">
              ...
            </span>
          )}
        </div>
      </div>
      {typeof document !== "undefined" && dropdown && createPortal(dropdown, document.body)}
    </>
  );
}
