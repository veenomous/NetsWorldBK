import { ImageResponse } from "next/og";

export const runtime = "edge";

/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */

async function loadLogo(requestUrl: string): Promise<string> {
  const base = new URL(requestUrl).origin;
  const res = await fetch(`${base}/og-logo.png`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:image/png;base64,${btoa(binary)}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "default";
  const pick = url.searchParams.get("pick") || "3";
  const score = url.searchParams.get("score") || "75";
  const grade = url.searchParams.get("grade") || "B+";
  const player = url.searchParams.get("player") || "";
  const percentile = url.searchParams.get("percentile") || "65";

  let logoSrc = "";
  try {
    logoSrc = await loadLogo(request.url);
  } catch {
    // Will fall back to text
  }

  const logo = logoSrc
    ? <img src={logoSrc} width={150} height={150} />
    : <div style={{ display: "flex", marginBottom: 16 }}><span style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginRight: 8 }}>BK</span><span style={{ fontSize: 36, fontWeight: 900, color: "#e87a2e" }}>GRIT</span></div>;

  const bigLogo = logoSrc
    ? <img src={logoSrc} width={250} height={250} />
    : <div style={{ display: "flex", marginBottom: 20 }}><span style={{ fontSize: 56, fontWeight: 900, color: "#fff", marginRight: 12 }}>BK</span><span style={{ fontSize: 56, fontWeight: 900, color: "#e87a2e" }}>GRIT</span></div>;

  const cacheHeaders = { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" };

  if (type === "lottery") {
    const pickNum = parseInt(pick);
    const pickColor = pickNum === 1 ? "#ffc312" : pickNum <= 3 ? "#00d68f" : "#94949e";

    return new ImageResponse(
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#0c0c0f", padding: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 60 }}>
          {logo}
          <div style={{ display: "flex", fontSize: 16, color: "#5c5c66", marginTop: 16 }}>bkgrit.com</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 16, color: "#94949e", marginBottom: 8 }}>NBA DRAFT LOTTERY RESULT</div>
          <div style={{ display: "flex", fontSize: 160, fontWeight: 900, color: pickColor }}>#{pick}</div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#fff", marginTop: 4 }}>BROOKLYN NETS</div>
          <div style={{ display: "flex", fontSize: 18, color: "#5c5c66", marginTop: 20 }}>Can you beat this? Try at bkgrit.com</div>
        </div>
      </div>,
      { width: 1200, height: 630, headers: cacheHeaders },
    );
  }

  if (type === "gm") {
    const scoreNum = parseInt(score);
    const scoreColor = scoreNum >= 80 ? "#00d68f" : scoreNum >= 60 ? "#ffc312" : "#ff4757";
    const playerText = player ? "Drafted: " + player : "";

    return new ImageResponse(
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#0c0c0f", padding: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 60 }}>
          {logo}
          <div style={{ display: "flex", fontSize: 16, color: "#5c5c66", marginTop: 16 }}>bkgrit.com</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 16, color: "#94949e", marginBottom: 8 }}>DRAFT WAR ROOM SCORE</div>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ fontSize: 120, fontWeight: 900, color: scoreColor, marginRight: 8 }}>{score}</span>
            <span style={{ fontSize: 40, color: "#5c5c66", fontWeight: 700 }}>/100</span>
          </div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 900, color: scoreColor, marginTop: 8 }}>Grade: {grade}</div>
          <div style={{ display: "flex", fontSize: 22, color: "#fff", marginTop: 12 }}>{playerText}</div>
          <div style={{ display: "flex", fontSize: 18, color: "#94949e", marginTop: 8 }}>Better than {percentile}% of Nets fans</div>
        </div>
      </div>,
      { width: 1200, height: 630, headers: cacheHeaders },
    );
  }

  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#0c0c0f" }}>
      {bigLogo}
      <div style={{ display: "flex", fontSize: 28, color: "#94949e", marginTop: 16 }}>Brooklyn Grit — Nets Fanatic</div>
      <div style={{ display: "flex", fontSize: 18, color: "#5c5c66", marginTop: 8 }}>Draft Tracker · Lottery Sim · War Room · Hot Takes</div>
    </div>,
    { width: 1200, height: 630, headers: cacheHeaders },
  );
}
