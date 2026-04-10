"use client";

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface EntityData {
  title: string;
  category: string;
  slug: string;
  confidence: string;
  summary: string;
}

const confColor: Record<string, string> = {
  high: "bg-[rgba(22,163,74,0.15)] text-[#16a34a]",
  medium: "bg-[rgba(217,119,6,0.15)] text-[#d97706]",
  low: "bg-[rgba(228,60,62,0.15)] text-[#E43C3E]",
};

export default function KBHoverCard({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const [data, setData] = useState<EntityData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fetchedRef = useRef(false);

  const show = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({
          top: rect.bottom + 8,
          left: Math.min(rect.left, window.innerWidth - 300),
        });
      }
      setIsVisible(true);

      // Fetch data if not already fetched
      if (!fetchedRef.current) {
        fetchedRef.current = true;
        fetch(`/api/kb/entity?name=${encodeURIComponent(name)}`)
          .then((r) => r.json())
          .then((d) => { if (d.result) setData(d.result); })
          .catch(() => {});
      }
    }, 300);
  }, [name]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsVisible(false), 200);
  }, []);

  const keepOpen = useCallback(() => {
    clearTimeout(timerRef.current);
  }, []);

  const card = isVisible && data ? (
    <div
      onMouseEnter={keepOpen}
      onMouseLeave={hide}
      style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
      className="w-[280px] bg-[#111] border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.7)] p-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-white/30 text-[10px] tracking-[0.12em] uppercase font-bold font-body">
          {data.category.replace("-", " ")}
        </span>
        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${confColor[data.confidence] || confColor.medium}`}>
          {data.confidence}
        </span>
      </div>
      <p className="font-display font-bold text-sm text-white uppercase tracking-tight mb-2">
        {data.title}
      </p>
      <p className="text-white/35 text-[11px] font-body leading-relaxed mb-3">
        {data.summary}
      </p>
      <Link
        href={`/kb/${data.category}/${data.slug}`}
        className="block text-center text-[#E43C3E] text-[11px] font-bold uppercase tracking-wider hover:underline"
      >
        Read more &rarr;
      </Link>
    </div>
  ) : null;

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        className="text-brand-red font-semibold cursor-pointer border-b border-brand-red/30 hover:border-brand-red transition-colors"
      >
        {children}
      </span>
      {typeof document !== "undefined" && card && createPortal(card, document.body)}
    </>
  );
}
