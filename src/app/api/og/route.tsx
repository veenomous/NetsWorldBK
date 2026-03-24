import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "default";
  const pick = url.searchParams.get("pick") || "3";
  const score = url.searchParams.get("score") || "75";
  const grade = url.searchParams.get("grade") || "B+";
  const player = url.searchParams.get("player") || "";
  const percentile = url.searchParams.get("percentile") || "65";

  if (type === "lottery") {
    const pickNum = parseInt(pick);
    const pickColor = pickNum === 1 ? "#ffc312" : pickNum <= 3 ? "#00d68f" : "#94949e";

    return new ImageResponse(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#0c0c0f",
          padding: "40px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#fff" }}>BK</span>
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#e87a2e" }}>GRIT</span>
        </div>
        <div style={{ fontSize: "16px", color: "#94949e", letterSpacing: "6px", marginBottom: "20px" }}>
          NBA DRAFT LOTTERY RESULT
        </div>
        <div style={{ fontSize: "180px", fontWeight: 900, color: pickColor, lineHeight: 1 }}>
          #{pick}
        </div>
        <div style={{ fontSize: "32px", fontWeight: 700, color: "#fff", marginTop: "12px" }}>
          BROOKLYN NETS
        </div>
        <div style={{ fontSize: "18px", color: "#5c5c66", marginTop: "32px" }}>
          Can you beat this? Try at bkgrit.com
        </div>
      </div>,
      { width: 1200, height: 630 },
    );
  }

  if (type === "gm") {
    const scoreNum = parseInt(score);
    const scoreColor = scoreNum >= 80 ? "#00d68f" : scoreNum >= 60 ? "#ffc312" : "#ff4757";

    return new ImageResponse(
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#0c0c0f",
          padding: "40px",
        }}
      >
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#fff" }}>BK</span>
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#e87a2e" }}>GRIT</span>
        </div>
        <div style={{ fontSize: "16px", color: "#94949e", letterSpacing: "6px", marginBottom: "20px" }}>
          DRAFT WAR ROOM SCORE
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span style={{ fontSize: "160px", fontWeight: 900, color: scoreColor, lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: "48px", color: "#5c5c66", fontWeight: 700 }}>/100</span>
        </div>
        <div style={{ fontSize: "28px", fontWeight: 900, color: scoreColor, marginTop: "16px" }}>
          Grade: {grade}
        </div>
        {player ? (
          <div style={{ fontSize: "24px", color: "#fff", marginTop: "16px", fontWeight: 600 }}>
            Drafted: {player}
          </div>
        ) : null}
        <div style={{ fontSize: "20px", color: "#94949e", marginTop: "12px" }}>
          Better than {percentile}% of Nets fans
        </div>
        <div style={{ fontSize: "18px", color: "#5c5c66", marginTop: "28px" }}>
          Play GM at bkgrit.com
        </div>
      </div>,
      { width: 1200, height: 630 },
    );
  }

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#0c0c0f",
        padding: "40px",
      }}
    >
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        <span style={{ fontSize: "56px", fontWeight: 900, color: "#fff" }}>BK</span>
        <span style={{ fontSize: "56px", fontWeight: 900, color: "#e87a2e" }}>GRIT</span>
      </div>
      <div style={{ fontSize: "24px", color: "#94949e" }}>Brooklyn Grit — Nets Fanatic</div>
      <div style={{ fontSize: "18px", color: "#5c5c66", marginTop: "8px" }}>
        Draft Tracker · Lottery Sim · War Room · Hot Takes
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
