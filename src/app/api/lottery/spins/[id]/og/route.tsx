import { ImageResponse } from "next/og";

/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */

export const runtime = "edge";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU";

const RED = "#E43C3E";

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

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const origin = new URL(req.url).origin;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/lottery_spins?id=eq.${id}&select=nets_pick,top_4,spot_change,display_name,x_handle`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
  );
  const rows = await res.json();
  const spin = rows?.[0];
  if (!spin) return new Response("Not found", { status: 404 });

  const pick: number = spin.nets_pick;
  const top4: boolean = !!spin.top_4;
  const change: number = spin.spot_change ?? 0;
  const display: string = spin.x_handle
    ? `@${String(spin.x_handle).replace(/^@/, "")}`
    : spin.display_name || "A fan";

  const changeText =
    change > 0 ? `Jumped ${change}` : change < 0 ? `Dropped ${Math.abs(change)}` : "Held slot";

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
        <div style={{ display: "flex", width: 8, backgroundColor: RED, height: "100%" }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "50px 64px",
            justifyContent: "space-between",
          }}
        >
          {/* Top bar */}
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
                  Lottery Sim
                </span>
              </div>
            </div>
            {top4 && (
              <div
                style={{
                  display: "flex",
                  fontSize: 14,
                  color: RED,
                  backgroundColor: `${RED}22`,
                  padding: "8px 16px",
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  fontWeight: 900,
                  border: `1px solid ${RED}55`,
                }}
              >
                Top 4
              </div>
            )}
          </div>

          {/* Center */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <span style={{ fontSize: 16, color: "#888", letterSpacing: 4, textTransform: "uppercase", fontWeight: 700 }}>
              Brooklyn Nets
            </span>
            <div
              style={{
                display: "flex",
                fontSize: 280,
                fontWeight: 900,
                color: RED,
                lineHeight: 0.9,
                letterSpacing: -8,
                marginTop: 10,
              }}
            >
              #{pick}
            </div>
            <span style={{ fontSize: 22, color: "#bbb", marginTop: 14, fontWeight: 500 }}>
              {changeText} · {display}
            </span>
          </div>

          {/* Bottom */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: `3px solid ${RED}`,
              paddingTop: 16,
              width: "100%",
            }}
          >
            <span style={{ fontSize: 14, color: "#777", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
              Spin your own at bkgrit.com/simulator
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
