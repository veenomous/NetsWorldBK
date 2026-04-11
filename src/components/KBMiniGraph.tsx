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
  { id: "marks", label: "SEAN MARKS", x: 0.15, y: 0.3, color: "#E43C3E", size: 6, href: "/kb/front-office/sean-marks-era", description: "GM — Architect of the rebuild" },
  { id: "kd", label: "KD TRADE", x: 0.35, y: 0.2, color: "#E43C3E", size: 8, href: "/kb/trades/kevin-durant-trade-tree", description: "9 FRPs + 2 swaps + MPJ" },
  { id: "kyrie", label: "KYRIE", x: 0.25, y: 0.65, color: "#E43C3E", size: 5, href: "/kb/trades/kyrie-irving-trade", description: "2029 Dallas first-rounder" },
  { id: "harden", label: "HARDEN", x: 0.1, y: 0.75, color: "#E43C3E", size: 5, href: "/kb/trades/james-harden-trade", description: "Rockets pick → Danny Wolf" },
  { id: "picks", label: "9 FRPS", x: 0.55, y: 0.35, color: "#0047AB", size: 7, href: "/kb/concepts/nets-pick-inventory", description: "Picks owed through 2032" },
  { id: "mpj", label: "MPJ", x: 0.6, y: 0.6, color: "#16a34a", size: 6, href: "/kb/players/michael-porter-jr", description: "24.2 PPG — Veteran anchor" },
  { id: "demin", label: "DEMIN", x: 0.75, y: 0.25, color: "#0047AB", size: 6, href: "/kb/players/egor-demin", description: "#8 pick — Franchise bet" },
  { id: "draft", label: "2025 DRAFT", x: 0.85, y: 0.5, color: "#0047AB", size: 5, href: "/kb/draft/2025-nba-draft", description: "5 first-rounders in one draft" },
  { id: "knicks", label: "KNICKS", x: 0.45, y: 0.75, color: "#0047AB", size: 5, href: "/kb/rivalries/nets-vs-knicks", description: "4 unprotected picks through 2031" },
  { id: "timeline", label: "2027-28", x: 0.9, y: 0.75, color: "#16a34a", size: 5, href: "/kb/concepts/rebuild-timeline", description: "Target competitive window" },
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
  const router = useRouter();
  const animRef = useRef(0);
  const pulseRef = useRef(0);
  const [hovered, setHovered] = useState<MiniNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = DISPLAY_W * dpr;
    canvas.height = DISPLAY_H * dpr;
    canvas.style.width = `${DISPLAY_W}px`;
    canvas.style.height = `${DISPLAY_H}px`;
    ctx.scale(dpr, dpr);

    function draw() {
      if (!ctx) return;
      pulseRef.current += 0.015;
      ctx.clearRect(0, 0, DISPLAY_W, DISPLAY_H);

      // Edges
      for (const edge of EDGES) {
        const a = NODES.find(n => n.id === edge.from)!;
        const b = NODES.find(n => n.id === edge.to)!;
        const isHighlighted = hovered && (hovered.id === a.id || hovered.id === b.id);
        ctx.beginPath();
        ctx.moveTo(a.x * DISPLAY_W, a.y * DISPLAY_H);
        ctx.lineTo(b.x * DISPLAY_W, b.y * DISPLAY_H);
        ctx.strokeStyle = isHighlighted ? "rgba(228,60,62,0.3)" : "rgba(0,0,0,0.07)";
        ctx.lineWidth = isHighlighted ? 2 : 1;
        ctx.stroke();
      }

      // Nodes
      for (const node of NODES) {
        const pulse = 1 + Math.sin(pulseRef.current + node.x * 5) * 0.1;
        const r = node.size * pulse;
        const px = node.x * DISPLAY_W;
        const py = node.y * DISPLAY_H;
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

      // Pulse
      const t = (pulseRef.current * 0.2) % 1;
      const marks = NODES.find(n => n.id === "marks")!;
      const kd = NODES.find(n => n.id === "kd")!;
      const ppx = marks.x * DISPLAY_W + (kd.x * DISPLAY_W - marks.x * DISPLAY_W) * t;
      const ppy = marks.y * DISPLAY_H + (kd.y * DISPLAY_H - marks.y * DISPLAY_H) * t;
      ctx.beginPath();
      ctx.arc(ppx, ppy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = "#E43C3E";
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [hovered]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let found: MiniNode | null = null;
    for (const node of NODES) {
      const dx = mx - node.x * DISPLAY_W;
      const dy = my - node.y * DISPLAY_H;
      if (dx * dx + dy * dy < (node.size + 12) * (node.size + 12)) {
        found = node;
        break;
      }
    }
    setHovered(found);
    if (found) {
      setTooltipPos({ x: found.x * DISPLAY_W, y: found.y * DISPLAY_H });
    }
    if (canvas) canvas.style.cursor = found ? "pointer" : "default";
  }, []);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const node of NODES) {
      const dx = mx - node.x * DISPLAY_W;
      const dy = my - node.y * DISPLAY_H;
      if (dx * dx + dy * dy < (node.size + 12) * (node.size + 12)) {
        router.push(node.href);
        return;
      }
    }
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
        onClick={handleClick}
        style={{ width: DISPLAY_W, height: DISPLAY_H }}
      />

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="absolute pointer-events-none bg-black text-white px-3 py-2 shadow-lg"
          style={{
            left: Math.min(tooltipPos.x + 12, DISPLAY_W - 180),
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
