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
  // Simulation state
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned?: boolean;
}

interface GraphEdge {
  source: string;
  target: string;
}

interface KBGraph {
  nodes: { id: string; title: string; category: string; slug: string; confidence: "high" | "medium" | "low"; linkCount: number }[];
  edges: GraphEdge[];
}

const CATEGORY_COLORS: Record<string, string> = {
  players: "#E43C3E",
  seasons: "#1a1c1c",
  trades: "#E43C3E",
  "front-office": "#1a1c1c",
  draft: "#0047AB",
  rivalries: "#0047AB",
  concepts: "#16a34a",
  rumors: "#E43C3E",
};

const CATEGORY_LABELS: Record<string, string> = {
  players: "Players",
  seasons: "Seasons",
  trades: "Trades",
  rumors: "Rumors",
  "front-office": "Front Office",
  draft: "Draft",
  rivalries: "Rivalries",
  concepts: "Concepts",
};

export default function KBGraphExplorer({ graph }: { graph: KBGraph }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const animRef = useRef<number>(0);
  const router = useRouter();

  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [dimensions, setDimensions] = useState({ w: 800, h: 600 });
  const dragRef = useRef<{ node: GraphNode; offsetX: number; offsetY: number } | null>(null);
  const didDragRef = useRef(false);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Initialize nodes with organized positions by category
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight - 120;
    setDimensions({ w, h });

    // Category zones — organized layout
    const categoryZones: Record<string, { x: number; y: number }> = {
      "front-office": { x: 0.1, y: 0.4 },
      seasons: { x: 0.15, y: 0.7 },
      trades: { x: 0.35, y: 0.7 },
      concepts: { x: 0.3, y: 0.2 },
      players: { x: 0.65, y: 0.35 },
      draft: { x: 0.75, y: 0.65 },
      rivalries: { x: 0.5, y: 0.5 },
      rumors: { x: 0.55, y: 0.15 },
    };

    // Group nodes by category and position within their zone
    const categoryNodes: Record<string, typeof graph.nodes> = {};
    for (const node of graph.nodes) {
      if (!categoryNodes[node.category]) categoryNodes[node.category] = [];
      categoryNodes[node.category].push(node);
    }

    nodesRef.current = graph.nodes.map((n) => {
      const zone = categoryZones[n.category] || { x: 0.5, y: 0.5 };
      const siblings = categoryNodes[n.category] || [];
      const idx = siblings.indexOf(n);
      const count = siblings.length;

      // Spread within zone
      const spread = Math.min(w, h) * 0.08;
      const angle = count > 1 ? (idx / count) * Math.PI * 2 : 0;

      return {
        ...n,
        x: zone.x * w + Math.cos(angle) * spread * Math.min(count, 4) * 0.5,
        y: zone.y * h + Math.sin(angle) * spread * Math.min(count, 4) * 0.5,
        vx: 0,
        vy: 0,
      };
    });
  }, [graph.nodes]);

  // Force simulation + rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nodes = nodesRef.current;
    const edges = graph.edges;
    const { w, h } = dimensions;

    let iteration = 0;

    function getNode(id: string): GraphNode | undefined {
      return nodes.find((n) => n.id === id);
    }

    function tick() {
      iteration++;
      const cooling = Math.max(0.005, 1 - iteration / 500);

      // Repulsion (all pairs)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (4000 / (dist * dist)) * cooling;
          dx = (dx / dist) * force;
          dy = (dy / dist) * force;
          a.vx -= dx;
          a.vy -= dy;
          b.vx += dx;
          b.vy += dy;
        }
      }

      // Attraction (edges)
      for (const edge of edges) {
        const a = getNode(edge.source);
        const b = getNode(edge.target);
        if (!a || !b) continue;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 150) * 0.005 * cooling;
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        a.vx += dx;
        a.vy += dy;
        b.vx -= dx;
        b.vy -= dy;
      }

      // Center gravity
      for (const node of nodes) {
        node.vx += (w / 2 - node.x) * 0.001 * cooling;
        node.vy += (h / 2 - node.y) * 0.001 * cooling;
      }

      // Apply velocity
      for (const node of nodes) {
        if (dragRef.current?.node.id === node.id) continue;
        if (node.pinned) continue;
        node.vx *= 0.7;
        node.vy *= 0.7;
        node.x += node.vx;
        node.y += node.vy;
        // Keep in bounds
        node.x = Math.max(60, Math.min(w - 60, node.x));
        node.y = Math.max(60, Math.min(h - 60, node.y));
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      // Draw edges
      for (const edge of edges) {
        const a = getNode(edge.source);
        const b = getNode(edge.target);
        if (!a || !b) continue;

        const isHovered =
          hoveredNode && (hoveredNode.id === a.id || hoveredNode.id === b.id);

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isHovered ? "rgba(228,60,62,0.5)" : "rgba(0,0,0,0.08)";
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();
      }

      // Draw nodes
      for (const node of nodes) {
        const color = CATEGORY_COLORS[node.category] || "#E43C3E";
        const isHovered = hoveredNode?.id === node.id;
        const isConnected =
          hoveredNode &&
          edges.some(
            (e) =>
              (e.source === hoveredNode.id && e.target === node.id) ||
              (e.target === hoveredNode.id && e.source === node.id)
          );
        const radius = 6 + node.linkCount * 1.5;

        // Glow for hovered/connected
        if (isHovered || isConnected) {
          const hex = color;
          const rr = parseInt(hex.slice(1,3),16), gg = parseInt(hex.slice(3,5),16), bb = parseInt(hex.slice(5,7),16);
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rr},${gg},${bb},0.12)`;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? "#000" : color;
        ctx.fill();

        // Border
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Label — smaller on mobile
        const dimmed = hoveredNode && !isHovered && !isConnected;
        const isMobile = w < 600;
        ctx.font = isMobile ? "bold 9px 'Space Grotesk', sans-serif" : "bold 11px 'Space Grotesk', sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = dimmed ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.7)";
        // Truncate long titles on mobile
        const label = isMobile && node.title.length > 15
          ? node.title.toUpperCase().slice(0, 14) + "..."
          : node.title.toUpperCase();
        ctx.fillText(label, node.x, node.y + radius + 14);
      }

      tick();
      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [graph.edges, dimensions, hoveredNode]);

  // Mouse interaction
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      mouseRef.current = { x: mx, y: my };

      // Dragging
      if (dragRef.current) {
        didDragRef.current = true;
        dragRef.current.node.x = mx - dragRef.current.offsetX;
        dragRef.current.node.y = my - dragRef.current.offsetY;
        dragRef.current.node.vx = 0;
        dragRef.current.node.vy = 0;
        return;
      }

      // Hover detection
      const nodes = nodesRef.current;
      let found: GraphNode | null = null;
      for (const node of nodes) {
        const dx = mx - node.x;
        const dy = my - node.y;
        const r = 6 + node.linkCount * 1.5 + 5;
        if (dx * dx + dy * dy < r * r) {
          found = node;
          break;
        }
      }
      setHoveredNode(found);
      canvas.style.cursor = found ? "pointer" : "grab";
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      didDragRef.current = false;

      const nodes = nodesRef.current;
      for (const node of nodes) {
        const dx = mx - node.x;
        const dy = my - node.y;
        const r = 6 + node.linkCount * 1.5 + 5;
        if (dx * dx + dy * dy < r * r) {
          dragRef.current = { node, offsetX: dx, offsetY: dy };
          canvas.style.cursor = "grabbing";
          return;
        }
      }
    },
    []
  );

  const handleMouseUp = useCallback(() => {
    if (dragRef.current && didDragRef.current) {
      dragRef.current.node.pinned = true;
      dragRef.current.node.vx = 0;
      dragRef.current.node.vy = 0;
    }
    dragRef.current = null;
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // If we just dragged, don't navigate
      if (didDragRef.current) {
        didDragRef.current = false;
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const nodes = nodesRef.current;
      for (const node of nodes) {
        const dx = mx - node.x;
        const dy = my - node.y;
        const r = 6 + node.linkCount * 1.5 + 5;
        if (dx * dx + dy * dy < r * r) {
          router.push(`/kb/${node.category}/${node.slug}`);
          return;
        }
      }
    },
    [router]
  );

  // Resize handler
  useEffect(() => {
    function handleResize() {
      setDimensions({ w: window.innerWidth, h: window.innerHeight - 120 });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={dimensions.w}
        height={dimensions.h}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY, } as unknown as React.MouseEvent<HTMLCanvasElement>);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as unknown as React.MouseEvent<HTMLCanvasElement>);
          e.preventDefault();
        }}
        onTouchEnd={() => {
          handleMouseUp();
          if (!didDragRef.current && hoveredNode) {
            router.push(`/kb/${hoveredNode.category}/${hoveredNode.slug}`);
          }
          didDragRef.current = false;
        }}
        className="block touch-none"
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <div key={cat} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5" style={{ background: color }} />
            <span className="text-[10px] text-text-muted tracking-[0.1em] uppercase font-bold font-body">
              {CATEGORY_LABELS[cat] || cat}
            </span>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div
          className="absolute pointer-events-none bg-black text-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
          style={{
            left: Math.max(8, Math.min(mouseRef.current.x + 16, dimensions.w - 260)),
            top: Math.max(8, Math.min(mouseRef.current.y - 10, dimensions.h - 100)),
            maxWidth: Math.min(260, dimensions.w - 16),
          }}
        >
          <p className="text-white/50 text-[10px] tracking-[0.12em] uppercase font-bold font-body">
            {CATEGORY_LABELS[hoveredNode.category] || hoveredNode.category}
          </p>
          <p className="font-display font-bold text-sm text-white uppercase tracking-tight mt-0.5">
            {hoveredNode.title}
          </p>
          <p className="text-white/40 text-[10px] font-body mt-1">
            {hoveredNode.linkCount} connections &middot; Click to read
          </p>
        </div>
      )}
    </div>
  );
}
