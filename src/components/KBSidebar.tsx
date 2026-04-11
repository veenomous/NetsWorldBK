"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface EntityResult {
  title: string;
  category: string;
  slug: string;
  confidence: string;
  summary: string;
  tags: string[];
}

const confColor: Record<string, string> = {
  high: "bg-[rgba(22,163,74,0.15)] text-[#16a34a]",
  medium: "bg-[rgba(0,71,171,0.1)] text-[#0047AB]",
  low: "bg-[rgba(228,60,62,0.15)] text-[#E43C3E]",
};

export default function KBSidebar({
  entity,
  onClose,
}: {
  entity: string | null;
  onClose?: () => void;
}) {
  const [result, setResult] = useState<EntityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!entity) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    fetch(`/api/kb/entity?name=${encodeURIComponent(entity)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.result) {
          setResult(data.result);
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      })
      .catch(() => setIsOpen(false))
      .finally(() => setIsLoading(false));
  }, [entity]);

  if (!isOpen && !isLoading) return null;

  return (
    <div className="border-l border-white/10 bg-black text-white w-full md:w-[320px] shrink-0 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-brand-red text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
            auto_stories
          </span>
          <span className="text-[10px] text-white/40 tracking-[0.15em] uppercase font-bold font-body">
            Wiki Intel
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <div className="h-4 bg-white/5 animate-pulse-soft w-2/3" />
          <div className="h-3 bg-white/5 animate-pulse-soft w-full" />
          <div className="h-3 bg-white/5 animate-pulse-soft w-4/5" />
        </div>
      )}

      {result && !isLoading && (
        <>
          {/* Category + confidence */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white/30 text-[10px] tracking-[0.12em] uppercase font-bold font-body">
              {result.category.replace("-", " ")}
            </span>
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${confColor[result.confidence] || confColor.medium}`}>
              {result.confidence}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display font-black text-base uppercase tracking-tight text-white mb-2">
            {result.title}
          </h3>

          {/* Summary */}
          <p className="text-white/40 text-xs font-body leading-relaxed mb-3">
            {result.summary}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {result.tags.slice(0, 5).map((tag) => (
              <span key={tag} className="text-[9px] text-white/25 bg-white/5 px-2 py-0.5 uppercase tracking-wider font-bold">
                {tag}
              </span>
            ))}
          </div>

          {/* Read more */}
          <Link
            href={`/kb/${result.category}/${result.slug}`}
            className="block text-center bg-brand-red/10 text-brand-red font-display font-bold text-xs uppercase tracking-wider py-2 hover:bg-brand-red/20 transition-colors"
          >
            Read Full Article &rarr;
          </Link>
        </>
      )}
    </div>
  );
}
