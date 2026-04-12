import { ImageResponse } from "next/og";

export const runtime = "edge";

/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */

async function loadImage(requestUrl: string, path: string): Promise<string> {
  try {
    const base = new URL(requestUrl).origin;
    const res = await fetch(`${base}${path}`);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:image/png;base64,${btoa(binary)}`;
  } catch {
    return "";
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "default";
  const pick = url.searchParams.get("pick") || "3";
  const score = url.searchParams.get("score") || "75";
  const grade = url.searchParams.get("grade") || "B+";
  const player = url.searchParams.get("player") || "";
  const percentile = url.searchParams.get("percentile") || "65";

  const logoSrc = await loadImage(request.url, "/FAV.png");
  const cacheHeaders = { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" };

  const RED = "#E43C3E";
  const BLUE = "#0047AB";

  const logo = logoSrc
    ? <img src={logoSrc} width={120} height={120} />
    : <div style={{ display: "flex", fontSize: 48, fontWeight: 900, color: "#fff" }}>BK GRIT</div>;

  if (type === "lottery") {
    const pickNum = parseInt(pick);
    const pickColor = pickNum === 1 ? "#16a34a" : pickNum <= 3 ? BLUE : "#888";

    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", backgroundColor: "#000", color: "#fff" }}>
        {/* Left side */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "40%", borderRight: `6px solid ${RED}` }}>
          {logo}
          <div style={{ display: "flex", fontSize: 14, color: "#666", marginTop: 16, letterSpacing: 4 }}>BKGRIT.COM</div>
        </div>
        {/* Right side */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "60%" }}>
          <div style={{ display: "flex", fontSize: 14, color: "#666", letterSpacing: 4 }}>NBA DRAFT LOTTERY</div>
          <div style={{ display: "flex", fontSize: 180, fontWeight: 900, color: pickColor, lineHeight: 1 }}>#{pick}</div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 900, color: "#fff" }}>BROOKLYN NETS</div>
          <div style={{ display: "flex", fontSize: 14, color: "#666", marginTop: 20 }}>Run yours at bkgrit.com/simulator</div>
        </div>
      </div>,
      { width: 1200, height: 630, headers: cacheHeaders },
    );
  }

  if (type === "gm") {
    const scoreNum = parseInt(score);
    const scoreColor = scoreNum >= 80 ? "#16a34a" : scoreNum >= 60 ? BLUE : RED;

    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", backgroundColor: "#000", color: "#fff" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "40%", borderRight: `6px solid ${BLUE}` }}>
          {logo}
          <div style={{ display: "flex", fontSize: 14, color: "#666", marginTop: 16, letterSpacing: 4 }}>BKGRIT.COM</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "60%" }}>
          <div style={{ display: "flex", fontSize: 14, color: "#666", letterSpacing: 4 }}>WAR ROOM SCORE</div>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: 140, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 40, color: "#444", fontWeight: 700 }}>/100</span>
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 900, color: scoreColor }}>Grade: {grade}</div>
          {player && <div style={{ display: "flex", fontSize: 20, color: "#999", marginTop: 8 }}>Drafted: {player}</div>}
          <div style={{ display: "flex", fontSize: 14, color: "#666", marginTop: 16 }}>Better than {percentile}% of fans</div>
        </div>
      </div>,
      { width: 1200, height: 630, headers: cacheHeaders },
    );
  }

  // Wiki article OG image
  if (type === "wiki") {
    const title = url.searchParams.get("title") || "Brooklyn Nets Wiki";
    const category = url.searchParams.get("category") || "";
    const confidence = url.searchParams.get("confidence") || "";
    const confColor = confidence === "high" ? "#16a34a" : confidence === "low" ? RED : BLUE;

    return new ImageResponse(
      <div style={{ display: "flex", width: "100%", height: "100%", backgroundColor: "#000", color: "#fff" }}>
        {/* Left: logo + branding */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "35%", borderRight: `6px solid ${RED}` }}>
          {logo}
          <div style={{ display: "flex", fontSize: 12, color: "#666", marginTop: 16, letterSpacing: 4 }}>NETS WIKI</div>
        </div>
        {/* Right: article info */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "65%", padding: "40px 50px" }}>
          {category && (
            <div style={{ display: "flex", fontSize: 12, color: RED, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
              {category.replace("-", " ")}
            </div>
          )}
          <div style={{ display: "flex", fontSize: title.length > 30 ? 36 : 48, fontWeight: 900, lineHeight: 1.1, letterSpacing: -1, textTransform: "uppercase" }}>
            {title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20 }}>
            {confidence && (
              <div style={{ display: "flex", fontSize: 11, fontWeight: 700, color: confColor, backgroundColor: `${confColor}20`, padding: "4px 12px", letterSpacing: 2, textTransform: "uppercase" }}>
                {confidence} confidence
              </div>
            )}
            <div style={{ display: "flex", fontSize: 12, color: "#555" }}>bkgrit.com</div>
          </div>
        </div>
      </div>,
      { width: 1200, height: 630, headers: cacheHeaders },
    );
  }

  // Default OG image
  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", backgroundColor: "#fff", color: "#000" }}>
      {/* Left: white with logo */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "45%", borderRight: `8px solid ${RED}` }}>
        {logo}
      </div>
      {/* Right: text */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "55%", paddingLeft: 50 }}>
        <div style={{ display: "flex", fontSize: 52, fontWeight: 900, letterSpacing: -2, lineHeight: 1 }}>BK GRIT</div>
        <div style={{ display: "flex", fontSize: 20, color: RED, fontWeight: 700, marginTop: 8, letterSpacing: 2 }}>BROOKLYN NETS FAN HQ</div>
        <div style={{ display: "flex", fontSize: 16, color: "#999", marginTop: 16 }}>The Wire · The Press · Lottery Sim · War Room · Trade Machine</div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: cacheHeaders },
  );
}
