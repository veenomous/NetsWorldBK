"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface GraphNode {
  id: string;
  title: string;
  category: string;
  slug: string;
  confidence: "high" | "medium" | "low";
  linkCount: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

interface KBGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const CATEGORY_COLORS: Record<string, string> = {
  players: "#E43C3E",
  seasons: "#1a1c1c",
  trades: "#E43C3E",
  "front-office": "#1a1c1c",
  draft: "#0047AB",
  rivalries: "#0047AB",
  assets: "#0047AB",
  strategy: "#16a34a",
  community: "#1a1c1c",
  rumors: "#E43C3E",
};

const CATEGORY_LABELS: Record<string, string> = {
  players: "Players",
  seasons: "Seasons",
  trades: "Trades",
  "front-office": "Front Office",
  draft: "Draft",
  rivalries: "Rivalries",
  assets: "Cap & Assets",
  strategy: "Strategy",
  community: "Community",
  rumors: "Rumors",
};

interface CategoryBubble {
  name: string;
  label: string;
  color: string;
  x: number;
  y: number;
  radius: number;
  articles: GraphNode[];
  expanded: boolean;
  articlePositions: { node: GraphNode; x: number; y: number }[];
}

export default function KBGraphExplorer({ graph }: { graph: KBGraph }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const [hoveredItem, setHoveredItem] = useState<{ type: "category" | "article"; label: string; description: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const bubblesRef = useRef<CategoryBubble[]>([]);
  const animRef = useRef(0);
  const pulseRef = useRef(0);

  // Build category bubbles
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight - 120;
    setDimensions({ w, h });

    const categories = new Map<string, GraphNode[]>();
    for (const node of graph.nodes) {
      if (!categories.has(node.category)) categories.set(node.category, []);
      categories.get(node.category)!.push(node);
    }

    const catList = [...categories.entries()];
    const cx = w / 2;
    const cy = h / 2;
    const layoutRadius = Math.min(w, h) * 0.28;

    bubblesRef.current = catList.map(([name, articles], i) => {
      const angle = (i / catList.length) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * layoutRadius;
      const y = cy + Math.sin(angle) * layoutRadius;
      const radius = 18 + articles.length * 5;

      return {
        name,
        label: CATEGORY_LABELS[name] || name,
        color: CATEGORY_COLORS[name] || "#E43C3E",
        x: Math.max(radius + 20, Math.min(w - radius - 20, x)),
        y: Math.max(radius + 20, Math.min(h - radius - 20, y)),
        radius,
        articles,
        expanded: false,
        articlePositions: [],
      };
    });
  }, [graph.nodes]);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.w * dpr;
    canvas.height = dimensions.h * dpr;
    canvas.style.width = `${dimensions.w}px`;
    canvas.style.height = `${dimensions.h}px`;
    ctx.scale(dpr, dpr);

    const { w, h } = dimensions;

    function draw() {
      if (!ctx) return;
      pulseRef.current += 0.012;
      ctx.clearRect(0, 0, w, h);
      const bubbles = bubblesRef.current;

      // Lines between connected categories
      for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
          const a = bubbles[i];
          const b = bubbles[j];
          const hasConnection = graph.edges.some(e =>
            (a.articles.some(n => n.id === e.source) && b.articles.some(n => n.id === e.target)) ||
            (a.articles.some(n => n.id === e.target) && b.articles.some(n => n.id === e.source))
          );
          if (hasConnection) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = "rgba(0,0,0,0.06)";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Lines between expanded article nodes
      for (const edge of graph.edges) {
        let ax: number | null = null, ay: number | null = null;
        let bx: number | null = null, by: number | null = null;
        for (const bubble of bubbles) {
          if (!bubble.expanded) continue;
          for (const ap of bubble.articlePositions) {
            if (ap.node.id === edge.source) { ax = ap.x; ay = ap.y; }
            if (ap.node.id === edge.target) { bx = ap.x; by = ap.y; }
          }
        }
        if (ax !== null && ay !== null && bx !== null && by !== null) {
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.strokeStyle = "rgba(228,60,62,0.15)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw bubbles
      for (const bubble of bubbles) {
        const pulse = 1 + Math.sin(pulseRef.current + bubble.x * 0.008) * 0.04;
        const r = bubble.radius * pulse;
        const hex = bubble.color;
        const cr = parseInt(hex.slice(1, 3), 16), cg = parseInt(hex.slice(3, 5), 16), cb = parseInt(hex.slice(5, 7), 16);

        if (!bubble.expanded) {
          // Glow
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, r + 5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},0.06)`;
          ctx.fill();

          // Circle
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, r, 0, Math.PI * 2);
          ctx.fillStyle = bubble.color;
          ctx.fill();

          // Label
          ctx.font = "bold 10px 'Space Grotesk', sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff";
          ctx.fillText(bubble.label.toUpperCase(), bubble.x, bubble.y - 2);
          ctx.font = "9px 'Space Grotesk', sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.fillText(`${bubble.articles.length} articles`, bubble.x, bubble.y + 12);
        } else {
          // Expanded: faded ring
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, r + 30 + bubble.articles.length * 5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.1)`;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Center dot
          ctx.beginPath();
          ctx.arc(bubble.x, bubble.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},0.3)`;
          ctx.fill();

          // Category label above
          ctx.font = "bold 11px 'Space Grotesk', sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = bubble.color;
          ctx.fillText(bubble.label.toUpperCase(), bubble.x, bubble.y - r - 15);

          // Article nodes
          for (const ap of bubble.articlePositions) {
            const nodeR = 4 + ap.node.linkCount * 0.7;
            const nodePulse = 1 + Math.sin(pulseRef.current * 2 + ap.x * 0.01) * 0.1;

            ctx.beginPath();
            ctx.arc(ap.x, ap.y, nodeR * nodePulse, 0, Math.PI * 2);
            ctx.fillStyle = bubble.color;
            ctx.fill();

            ctx.font = "bold 8px 'Space Grotesk', sans-serif";
            ctx.textAlign = "center";
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            const label = ap.node.title.length > 16 ? ap.node.title.slice(0, 15) + "..." : ap.node.title;
            ctx.fillText(label.toUpperCase(), ap.x, ap.y + nodeR + 11);
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [dimensions, graph.edges]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const bubbles = bubblesRef.current;

    // Check expanded article nodes first
    for (const bubble of bubbles) {
      if (!bubble.expanded) continue;
      for (const ap of bubble.articlePositions) {
        const dx = mx - ap.x;
        const dy = my - ap.y;
        const r = 4 + ap.node.linkCount * 0.7 + 10;
        if (dx * dx + dy * dy < r * r) {
          router.push(`/kb/${ap.node.category}/${ap.node.slug}`);
          return;
        }
      }
    }

    // Check category bubbles
    for (const bubble of bubbles) {
      const dx = mx - bubble.x;
      const dy = my - bubble.y;
      if (dx * dx + dy * dy < bubble.radius * bubble.radius) {
        bubble.expanded = !bubble.expanded;
        if (bubble.expanded) {
          const expandR = bubble.radius + 25 + bubble.articles.length * 4;
          bubble.articlePositions = bubble.articles.map((node, i) => {
            const angle = (i / bubble.articles.length) * Math.PI * 2 - Math.PI / 2;
            return {
              node,
              x: Math.max(30, Math.min(dimensions.w - 30, bubble.x + Math.cos(angle) * expandR)),
              y: Math.max(30, Math.min(dimensions.h - 30, bubble.y + Math.sin(angle) * expandR)),
            };
          });
        } else {
          bubble.articlePositions = [];
        }
        return;
      }
    }
  }, [router, dimensions]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setMousePos({ x: mx, y: my });
    const bubbles = bubblesRef.current;

    for (const bubble of bubbles) {
      if (!bubble.expanded) continue;
      for (const ap of bubble.articlePositions) {
        const dx = mx - ap.x;
        const dy = my - ap.y;
        if (dx * dx + dy * dy < 200) {
          setHoveredItem({ type: "article", label: ap.node.title, description: `${ap.node.linkCount} connections · Click to read` });
          canvas.style.cursor = "pointer";
          return;
        }
      }
    }

    for (const bubble of bubbles) {
      const dx = mx - bubble.x;
      const dy = my - bubble.y;
      if (dx * dx + dy * dy < bubble.radius * bubble.radius) {
        setHoveredItem({ type: "category", label: bubble.label, description: `${bubble.articles.length} articles · Click to ${bubble.expanded ? "collapse" : "expand"}` });
        canvas.style.cursor = "pointer";
        return;
      }
    }

    setHoveredItem(null);
    canvas.style.cursor = "default";
  }, []);

  useEffect(() => {
    const handleResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight - 120 });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        className="block"
      />

      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3">
        {Object.entries(CATEGORY_COLORS).filter(([cat]) =>
          graph.nodes.some(n => n.category === cat)
        ).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5" style={{ background: color }} />
            <span className="text-[10px] text-text-muted tracking-[0.1em] uppercase font-bold font-body">
              {CATEGORY_LABELS[cat] || cat}
            </span>
          </div>
        ))}
      </div>

      {hoveredItem && (
        <div
          className="absolute pointer-events-none bg-black text-white px-3 py-2 shadow-lg"
          style={{
            left: Math.max(8, Math.min(mousePos.x + 16, dimensions.w - 200)),
            top: Math.max(8, Math.min(mousePos.y - 10, dimensions.h - 60)),
          }}
        >
          <p className="font-display font-bold text-[11px] uppercase tracking-tight">{hoveredItem.label}</p>
          <p className="text-white/50 text-[10px] font-body mt-0.5">{hoveredItem.description}</p>
        </div>
      )}
    </div>
  );
}
