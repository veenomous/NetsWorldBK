import { ImageResponse } from "next/og";

export const runtime = "edge";

const LOGO_URL = "https://bkgrit.com/og-logo.png";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "default";
  const pick = url.searchParams.get("pick") || "3";
  const score = url.searchParams.get("score") || "75";
  const grade = url.searchParams.get("grade") || "B+";
  const player = url.searchParams.get("player") || "";
  const percentile = url.searchParams.get("percentile") || "65";

  /* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */

  if (type === "lottery") {
    const pickNum = parseInt(pick);
    const pickColor = pickNum === 1 ? "#ffc312" : pickNum <= 3 ? "#00d68f" : "#94949e";

    return new ImageResponse(
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#0c0c0f", padding: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 60 }}>
          <img src={LOGO_URL} width={200} height={200} />
          <div style={{ display: "flex", fontSize: 16, color: "#5c5c66", marginTop: 16 }}>bkgrit.com</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 16, color: "#94949e", marginBottom: 8 }}>NBA DRAFT LOTTERY RESULT</div>
          <div style={{ display: "flex", fontSize: 160, fontWeight: 900, color: pickColor }}>#{pick}</div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: "#fff", marginTop: 4 }}>BROOKLYN NETS</div>
          <div style={{ display: "flex", fontSize: 18, color: "#5c5c66", marginTop: 20 }}>Can you beat this? Try at bkgrit.com</div>
        </div>
      </div>,
      { width: 1200, height: 630 },
    );
  }

  if (type === "gm") {
    const scoreNum = parseInt(score);
    const scoreColor = scoreNum >= 80 ? "#00d68f" : scoreNum >= 60 ? "#ffc312" : "#ff4757";
    const playerText = player ? "Drafted: " + player : "";

    return new ImageResponse(
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#0c0c0f", padding: 60 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 60 }}>
          <img src={LOGO_URL} width={200} height={200} />
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
      { width: 1200, height: 630 },
    );
  }

  // Default — big centered logo
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#0c0c0f" }}>
      <img src={LOGO_URL} width={300} height={300} style={{ marginBottom: 20 }} />
      <div style={{ display: "flex", fontSize: 28, color: "#94949e", marginTop: 8 }}>Brooklyn Grit — Nets Fanatic</div>
      <div style={{ display: "flex", fontSize: 18, color: "#5c5c66", marginTop: 8 }}>Draft Tracker · Lottery Sim · War Room · Hot Takes</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
