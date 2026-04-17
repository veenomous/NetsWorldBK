import { ImageResponse } from "next/og";

/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */

export const runtime = "edge";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU";

const RED = "#E43C3E";
const BLUE = "#0047AB";
const GREEN = "#16a34a";

async function loadImage(origin: string, path: string): Promise<string> {
  try {
    const res = await fetch(`${origin}${path}`);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return `data:image/png;base64,${btoa(binary)}`;
  } catch {
    return "";
  }
}

function formatTimestamp(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; idx: string }> },
) {
  const { id, idx } = await params;
  const origin = new URL(req.url).origin;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/podcast_episodes?id=eq.${id}&select=title,hot_moments,podcasts(name)`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  const rows = await res.json();
  const episode = rows?.[0];
  if (!episode) return new Response("Not found", { status: 404 });

  const moments = (episode.hot_moments || []) as {
    quote: string;
    topic: string;
    timestamp_ms: number;
    fire_level: number;
  }[];
  const i = parseInt(idx, 10);
  const moment = moments[i];
  if (!moment) return new Response("Moment not found", { status: 404 });

  const showName = (episode.podcasts?.name as string) || "Brooklyn Nets Podcast";
  const quote = moment.quote;
  const quoteLen = quote.length;
  const quoteFontSize = quoteLen > 180 ? 38 : quoteLen > 120 ? 46 : quoteLen > 70 ? 56 : 66;
  const accent = moment.fire_level >= 4 ? RED : moment.fire_level >= 3 ? BLUE : GREEN;

  const logoSrc = await loadImage(origin, "/FAV.png");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#000",
          color: "#fff",
          padding: 60,
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar: logo + show attribution */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {logoSrc ? (
              <img src={logoSrc} width={60} height={60} />
            ) : (
              <div style={{ display: "flex", fontSize: 28, fontWeight: 900, color: RED }}>BK</div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>BKGRIT</span>
              <span style={{ fontSize: 12, color: "#666", letterSpacing: 3, textTransform: "uppercase" }}>
                Nets Wiki
              </span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 12,
              color: accent,
              backgroundColor: `${accent}22`,
              padding: "6px 14px",
              letterSpacing: 2,
              textTransform: "uppercase",
              fontWeight: 800,
              border: `1px solid ${accent}55`,
            }}
          >
            {"🔥".repeat(Math.min(moment.fire_level, 5))} {moment.topic}
          </div>
        </div>

        {/* Quote */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              fontSize: 120,
              color: accent,
              lineHeight: 0.8,
              fontWeight: 900,
              marginBottom: -10,
            }}
          >
            &ldquo;
          </div>
          <div
            style={{
              display: "flex",
              fontSize: quoteFontSize,
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: -0.5,
              color: "#fff",
            }}
          >
            {quote}
          </div>
        </div>

        {/* Bottom: show attribution + timestamp */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `3px solid ${accent}`,
            paddingTop: 24,
            width: "100%",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 13, color: "#777", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
              From
            </span>
            <span style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginTop: 4, letterSpacing: -0.3 }}>
              {showName}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: 13, color: accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
              {formatTimestamp(moment.timestamp_ms)}
            </span>
            <span style={{ fontSize: 14, color: "#555", marginTop: 4 }}>bkgrit.com</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    },
  );
}
