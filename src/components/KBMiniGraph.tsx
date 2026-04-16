"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MiniNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  size: number;
  href: string;
  description: string;
}

interface MiniEdge {
  from: string;
  to: string;
}

const NODES: MiniNode[] = [
  { id: "marks", label: "SEAN MARKS", x: 0.12, y: 0.3, color: "#E43C3E", size: 9, href: "/kb/front-office/sean-marks-era", description: "GM — Architect of the rebuild" },
  { id: "kd", label: "KD TRADE", x: 0.32, y: 0.18, color: "#E43C3E", size: 11, href: "/kb/trades/kevin-durant-trade-tree", description: "The foundational trade" },
  { id: "kyrie", label: "KYRIE", x: 0.2, y: 0.68, color: "#E43C3E", size: 5, href: "/kb/trades/kyrie-irving-trade", description: "2029 Dallas first-rounder" },
  { id: "harden", label: "HARDEN", x: 0.08, y: 0.78, color: "#E43C3E", size: 5, href: "/kb/trades/james-harden-trade", description: "Rockets pick → Danny Wolf" },
  { id: "picks", label: "PICKS", x: 0.5, y: 0.32, color: "#0047AB", size: 9, href: "/kb/assets/nets-pick-inventory", description: "Picks owed through 2032" },
  { id: "mpj", label: "MPJ", x: 0.55, y: 0.58, color: "#16a34a", size: 7, href: "/kb/players/michael-porter-jr", description: "24.2 PPG — Veteran anchor" },
  { id: "demin", label: "DEMIN", x: 0.68, y: 0.22, color: "#0047AB", size: 8, href: "/kb/players/egor-demin", description: "#8 pick — Franchise bet" },
  { id: "draft", label: "DRAFT", x: 0.75, y: 0.48, color: "#0047AB", size: 6, href: "/kb/draft/2025-nba-draft", description: "5 first-rounders in one draft" },
  { id: "knicks", label: "KNICKS", x: 0.38, y: 0.72, color: "#0047AB", size: 6, href: "/kb/rivalries/nets-vs-knicks", description: "4 unprotected picks through 2031" },
  { id: "timeline", label: "2027-28", x: 0.75, y: 0.75, color: "#16a34a", size: 7, href: "/kb/strategy/rebuild-timeline", description: "Target competitive window" },
];

const EDGES: MiniEdge[] = [
  { from: "marks", to: "kd" },
  { from: "marks", to: "kyrie" },
  { from: "marks", to: "harden" },
  { from: "kd", to: "picks" },
  { from: "kd", to: "mpj" },
  { from: "kd", to: "knicks" },
  { from: "picks", to: "demin" },
  { from: "picks", to: "draft" },
  { from: "demin", to: "timeline" },
  { from: "draft", to: "timeline" },
  { from: "mpj", to: "timeline" },
  { from: "kyrie", to: "picks" },
  { from: "harden", to: "draft" },
  { from: "knicks", to: "picks" },
];

const DISPLAY_W = 400;
const DISPLAY_H = 220;

export default function KBMiniGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const animRef = useRef(0);
  const pulseRef = useRef(0);
  const [hovered, setHovered] = useState<MiniNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const sizeRef = useRef({ w: DISPLAY_W, h: DISPLAY_H });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = containerRef.current?.clientWidth || DISPLAY_W;
    const actualW = Math.min(cw, DISPLAY_W);
    const actualH = Math.round(actualW * (DISPLAY_H / DISPLAY_W));
    canvas.width = actualW * dpr;
    canvas.height = actualH * dpr;
    canvas.style.width = `${actualW}px`;
    canvas.style.height = `${actualH}px`;
    ctx.scale(dpr, dpr);

    const W = actualW;
    const H = actualH;
    sizeRef.current = { w: W, h: H };

    function draw() {
      if (!ctx) return;
      pulseRef.current += 0.015;
      ctx.clearRect(0, 0, W, H);

      // Edges
      for (const edge of EDGES) {
        const a = NODES.find(n => n.id === edge.from)!;
        const b = NODES.find(n => n.id === edge.to)!;
        const isHighlighted = hovered && (hovered.id === a.id || hovered.id === b.id);
        ctx.beginPath();
        ctx.moveTo(a.x * W, a.y * H);
        ctx.lineTo(b.x * W, b.y * H);
        ctx.strokeStyle = isHighlighted ? "rgba(228,60,62,0.3)" : "rgba(0,0,0,0.07)";
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.stroke();
      }

      // Nodes
      for (const node of NODES) {
        const pulse = 1 + Math.sin(pulseRef.current + node.x * 5) * 0.1;
        const r = node.size * pulse;
        const px = node.x * W;
        const py = node.y * H;
        const isHov = hovered?.id === node.id;

        // Glow
        const hex = node.color;
        const rr = parseInt(hex.slice(1,3),16), gg = parseInt(hex.slice(3,5),16), bb = parseInt(hex.slice(5,7),16);
        ctx.beginPath();
        ctx.arc(px, py, r + (isHov ? 6 : 3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rr},${gg},${bb},${isHov ? 0.2 : 0.08})`;
        ctx.fill();

        // Circle
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = isHov ? "#000" : node.color;
        ctx.fill();
        if (isHov) {
          ctx.strokeStyle = node.color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Label
        const dimmed = hovered && !isHov;
        ctx.font = `bold ${isHov ? 10 : 9}px 'Space Grotesk', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = dimmed ? "rgba(0,0,0,0.15)" : "rgba(0,0,0,0.6)";
        ctx.fillText(node.label, px, py + r + 13);
      }

      // Animated pulses along key paths
      function drawPulse(fromId: string, toId: string, color: string, speed: number, offset: number) {
        if (!ctx) return;
        const from = NODES.find(n => n.id === fromId)!;
        const to = NODES.find(n => n.id === toId)!;
        const t = ((pulseRef.current * speed) + offset) % 1;
        const px = from.x * W + (to.x * W - from.x * W) * t;
        const py = from.y * H + (to.y * H - from.y * H) * t;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Red: marks → kd → picks
      drawPulse("marks", "kd", "#E43C3E", 0.2, 0);
      drawPulse("kd", "picks", "#E43C3E", 0.18, 0.3);

      // Blue: picks → demin, picks → draft
      drawPulse("picks", "demin", "#0047AB", 0.15, 0.1);
      drawPulse("picks", "draft", "#0047AB", 0.16, 0.5);

      // Green: demin → timeline, mpj → timeline
      drawPulse("demin", "timeline", "#16a34a", 0.14, 0.2);
      drawPulse("mpj", "timeline", "#16a34a", 0.13, 0.7);

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [hovered]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = sizeRef.current.w / rect.width;
    const scaleY = sizeRef.current.h / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    let found: MiniNode | null = null;
    for (const node of NODES) {
      const dx = mx - node.x * sizeRef.current.w;
      const dy = my - node.y * sizeRef.current.h;
      if (dx * dx + dy * dy < (node.size + 12) * (node.size + 12)) {
        found = node;
        break;
      }
    }
    setHovered(found);
    if (found) {
      setTooltipPos({ x: found.x * sizeRef.current.w, y: found.y * sizeRef.current.h });
    }
    if (canvas) canvas.style.cursor = found ? "pointer" : "default";
  }, []);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = sizeRef.current.w / rect.width;
    const scaleY = sizeRef.current.h / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (const node of NODES) {
      const dx = mx - node.x * sizeRef.current.w;
      const dy = my - node.y * sizeRef.current.h;
      if (dx * dx + dy * dy < (node.size + 12) * (node.size + 12)) {
        router.push(node.href);
        return;
      }
    }
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden w-full">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
        onClick={handleClick}
        style={{ width: "100%", height: "auto" }}
      />

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="absolute pointer-events-none bg-black text-white px-3 py-2 shadow-lg"
          style={{
            left: Math.min(tooltipPos.x + 12, (containerRef.current?.clientWidth || DISPLAY_W) - 180),
            top: Math.max(tooltipPos.y - 40, 4),
            maxWidth: 180,
          }}
        >
          <p className="font-display font-bold text-[11px] uppercase tracking-tight">{hovered.label}</p>
          <p className="text-white/50 text-[10px] font-body mt-0.5">{hovered.description}</p>
          <p className="text-brand-red text-[9px] font-bold mt-1">Click to read →</p>
        </div>
      )}

      <Link href="/kb/graph" className="mt-2 inline-flex items-center gap-1 text-[10px] text-brand-red hover:underline font-display font-bold uppercase tracking-wider">
        <span className="material-symbols-outlined text-xs">hub</span>
        Explore Full Graph
      </Link>
    </div>
  );
}
