import { ImageResponse } from "next/og";

/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */

export const runtime = "edge";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU";

const RED = "#E43C3E";
const BLUE = "#0047AB";

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

function isThrowback(createdAt: string, publishedAt: string | null): boolean {
  if (!publishedAt) return false;
  const created = new Date(createdAt).getTime();
  const published = new Date(publishedAt).getTime();
  if (!created || !published) return false;
  return created - published > 30 * 24 * 60 * 60 * 1000;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const origin = new URL(req.url).origin;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/podcast_episodes?id=eq.${id}&select=title,summary,hot_moments,published_at,created_at,podcasts(name)`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  const rows = await res.json();
  const episode = rows?.[0];
  if (!episode) return new Response("Not found", { status: 404 });

  const showName = (episode.podcasts?.name as string) || "Brooklyn Nets Podcast";
  const title = (episode.title as string) || "Episode";
  const summary = (episode.summary as string) || "";
  const throwback = isThrowback(episode.created_at, episode.published_at);
  const displayDate = formatDate(episode.published_at || episode.created_at);
  const hotMomentsCount = Array.isArray(episode.hot_moments) ? episode.hot_moments.length : 0;

  const titleLen = title.length;
  const titleFontSize = titleLen > 90 ? 54 : titleLen > 60 ? 66 : titleLen > 35 ? 80 : 96;

  const summaryTrimmed = summary.length > 200 ? summary.slice(0, 197).trimEnd() + "…" : summary;

  const logoSrc = await loadImage(origin, "/FAV.png");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          backgroundColor: "#000",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Left red stripe */}
        <div style={{ display: "flex", width: 8, backgroundColor: RED, height: "100%" }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "54px 64px",
            justifyContent: "space-between",
          }}
        >
          {/* Top bar: brand + meta */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {logoSrc ? (
                <img src={logoSrc} width={52} height={52} />
              ) : (
                <div style={{ display: "flex", fontSize: 28, fontWeight: 900, color: RED }}>BK</div>
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>BKGRIT</span>
                <span style={{ fontSize: 11, color: "#666", letterSpacing: 3, textTransform: "uppercase" }}>
                  Nets Wiki · Hot Mic
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {throwback && (
                <div
                  style={{
                    display: "flex",
                    fontSize: 12,
                    color: BLUE,
                    backgroundColor: `${BLUE}22`,
                    padding: "7px 14px",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    fontWeight: 800,
                    border: `1px solid ${BLUE}55`,
                  }}
                >
                  Throwback
                </div>
              )}
              {displayDate && (
                <span style={{ fontSize: 14, color: "#999", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
                  {displayDate}
                </span>
              )}
            </div>
          </div>

          {/* Title + summary */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", paddingRight: 20 }}>
            <span style={{ fontSize: 13, color: RED, letterSpacing: 3, textTransform: "uppercase", fontWeight: 800, marginBottom: 14 }}>
              From {showName}
            </span>
            <div
              style={{
                display: "flex",
                fontSize: titleFontSize,
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: -1.2,
                color: "#fff",
                marginBottom: 24,
              }}
            >
              {title}
            </div>
            {summaryTrimmed && (
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: "#bbb",
                  lineHeight: 1.35,
                  fontWeight: 400,
                }}
              >
                {summaryTrimmed}
              </div>
            )}
          </div>

          {/* Bottom strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `3px solid ${RED}`,
              paddingTop: 18,
              width: "100%",
            }}
          >
            <span style={{ fontSize: 14, color: "#777", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
              {hotMomentsCount > 0 ? `${hotMomentsCount} hot moments · transcript · chapters` : "Transcript · chapters · wiki cross-links"}
            </span>
            <span style={{ fontSize: 14, color: "#888", fontWeight: 700 }}>bkgrit.com</span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    },
  );
}
