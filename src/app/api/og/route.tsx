import { ImageResponse } from "next/og";

export const runtime = "edge";

async function fetchLogo(): Promise<string> {
  const res = await fetch("https://bkgrit.com/og-logo.png");
  const buf = await res.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return `data:image/png;base64,${base64}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "default";
  const pick = url.searchParams.get("pick") || "3";
  const score = url.searchParams.get("score") || "75";
  const grade = url.searchParams.get("grade") || "B+";
  const player = url.searchParams.get("player") || "";
  const percentile = url.searchParams.get("percentile") || "65";

  let logoSrc: string;
  try {
    logoSrc = await fetchLogo();
  } catch {
    logoSrc = "";
  }

  const logoImg = logoSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoSrc} alt="BK Grit" width={180} height={180} style={{ marginBottom: 16 }} />
  ) : (
    <div style={{ display: "flex", marginBottom: 16 }}>
      <span style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginRight: 8 }}>BK</span>
      <span style={{ fontSize: 36, fontWeight: 900, color: "#e87a2e" }}>GRIT</span>
    </div>
  );

  if (type === "lottery") {
    const pickNum = parseInt(pick);
    const pickColor = pickNum === 1 ? "#ffc312" : pickNum <= 3 ? "#00d68f" : "#94949e";

    return new ImageResponse(
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#0c0c0f" }}>
        {logoImg}
        <div style={{ display: "flex", fontSize: 14, color: "#94949e", marginBottom: 12 }}>NBA DRAFT LOTTERY RESULT</div>
        <div style={{ display: "flex", fontSize: 140, fontWeight: 900, color: pickColor }}>#{pick}</div>
        <div style={{ display: "flex", fontSize: 28, fontWeight: 700, color: "#fff", marginTop: 8 }}>BROOKLYN NETS</div>
        <div style={{ display: "flex", fontSize: 16, color: "#5c5c66", marginTop: 24 }}>Can you beat this? Try at bkgrit.com</div>
      </div>,
      { width: 1200, height: 630 },
    );
  }

  if (type === "gm") {
    const scoreNum = parseInt(score);
    const scoreColor = scoreNum >= 80 ? "#00d68f" : scoreNum >= 60 ? "#ffc312" : "#ff4757";
    const playerText = player ? "Drafted: " + player : "";

    return new ImageResponse(
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#0c0c0f" }}>
        {logoImg}
        <div style={{ display: "flex", fontSize: 14, color: "#94949e", marginBottom: 12 }}>DRAFT WAR ROOM SCORE</div>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 100, fontWeight: 900, color: scoreColor, marginRight: 8 }}>{score}</span>
          <span style={{ fontSize: 36, color: "#5c5c66", fontWeight: 700 }}>/100</span>
        </div>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 900, color: scoreColor, marginTop: 12 }}>Grade: {grade}</div>
        <div style={{ display: "flex", fontSize: 20, color: "#fff", marginTop: 12 }}>{playerText}</div>
        <div style={{ display: "flex", fontSize: 16, color: "#94949e", marginTop: 8 }}>Better than {percentile}% of Nets fans</div>
        <div style={{ display: "flex", fontSize: 14, color: "#5c5c66", marginTop: 20 }}>Play GM at bkgrit.com</div>
      </div>,
      { width: 1200, height: 630 },
    );
  }

  // Default — big logo
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", backgroundColor: "#0c0c0f" }}>
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoSrc} alt="BK Grit" width={280} height={280} style={{ marginBottom: 16 }} />
      ) : (
        <div style={{ display: "flex", marginBottom: 20 }}>
          <span style={{ fontSize: 56, fontWeight: 900, color: "#fff", marginRight: 12 }}>BK</span>
          <span style={{ fontSize: 56, fontWeight: 900, color: "#e87a2e" }}>GRIT</span>
        </div>
      )}
      <div style={{ display: "flex", fontSize: 22, color: "#94949e" }}>Brooklyn Grit — Nets Fanatic</div>
      <div style={{ display: "flex", fontSize: 16, color: "#5c5c66", marginTop: 8 }}>Draft Tracker · Lottery Sim · War Room · Hot Takes</div>
    </div>,
    { width: 1200, height: 630 },
  );
}
