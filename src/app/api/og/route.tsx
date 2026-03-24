import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "default";
  const pick = searchParams.get("pick") || "3";
  const score = searchParams.get("score") || "75";
  const grade = searchParams.get("grade") || "B+";
  const player = searchParams.get("player") || "";
  const percentile = searchParams.get("percentile") || "65";

  if (type === "lottery") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0c0c0f 0%, #1a1a20 100%)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Top bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #e87a2e, #ff9f43, #ffc312)",
            }}
          />

          {/* BK Grit branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "20px",
            }}
          >
            <span style={{ fontSize: "24px", fontWeight: 900, color: "#fff" }}>BK</span>
            <span style={{ fontSize: "24px", fontWeight: 900, color: "#e87a2e" }}>GRIT</span>
          </div>

          <div style={{ fontSize: "18px", color: "#94949e", marginBottom: "16px", letterSpacing: "4px" }}>
            NBA DRAFT LOTTERY RESULT
          </div>

          {/* Big pick number */}
          <div
            style={{
              fontSize: "160px",
              fontWeight: 900,
              lineHeight: 1,
              background: Number(pick) === 1
                ? "linear-gradient(135deg, #ffc312, #ff9f43)"
                : Number(pick) <= 3
                  ? "linear-gradient(135deg, #00d68f, #54a0ff)"
                  : "linear-gradient(135deg, #94949e, #5c5c66)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            #{pick}
          </div>

          <div style={{ fontSize: "28px", fontWeight: 700, color: "#fff", marginTop: "8px" }}>
            BROOKLYN NETS
          </div>

          <div
            style={{
              fontSize: "16px",
              color: "#94949e",
              marginTop: "24px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>Can you beat this? Try at bkgrit.com</span>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  if (type === "gm") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #0c0c0f 0%, #1a1a20 100%)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Top bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(90deg, #e87a2e, #ff9f43, #ffc312)",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <span style={{ fontSize: "24px", fontWeight: 900, color: "#fff" }}>BK</span>
            <span style={{ fontSize: "24px", fontWeight: 900, color: "#e87a2e" }}>GRIT</span>
          </div>

          <div style={{ fontSize: "18px", color: "#94949e", marginBottom: "16px", letterSpacing: "4px" }}>
            DRAFT WAR ROOM SCORE
          </div>

          {/* Score */}
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span
              style={{
                fontSize: "140px",
                fontWeight: 900,
                lineHeight: 1,
                color: Number(score) >= 80 ? "#00d68f" : Number(score) >= 60 ? "#ffc312" : "#ff4757",
              }}
            >
              {score}
            </span>
            <span style={{ fontSize: "48px", color: "#5c5c66", fontWeight: 700 }}>/100</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginTop: "12px",
            }}
          >
            <span
              style={{
                fontSize: "28px",
                fontWeight: 900,
                padding: "4px 20px",
                borderRadius: "12px",
                background: Number(score) >= 80 ? "rgba(0,214,143,0.15)" : "rgba(255,195,18,0.15)",
                color: Number(score) >= 80 ? "#00d68f" : "#ffc312",
              }}
            >
              Grade: {grade}
            </span>
          </div>

          {player && (
            <div style={{ fontSize: "22px", color: "#fff", marginTop: "16px", fontWeight: 600 }}>
              Drafted: {player}
            </div>
          )}

          <div style={{ fontSize: "20px", color: "#94949e", marginTop: "8px" }}>
            Better than {percentile}% of Nets fans
          </div>

          <div style={{ fontSize: "16px", color: "#5c5c66", marginTop: "24px" }}>
            Play GM at bkgrit.com
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // Default OG image
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0c0c0f 0%, #1a1a20 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #e87a2e, #ff9f43, #ffc312)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "48px", fontWeight: 900, color: "#fff" }}>BK</span>
          <span style={{ fontSize: "48px", fontWeight: 900, color: "#e87a2e" }}>GRIT</span>
        </div>
        <div style={{ fontSize: "24px", color: "#94949e", marginBottom: "8px" }}>Brooklyn Grit — Nets Fanatic</div>
        <div style={{ fontSize: "18px", color: "#5c5c66" }}>Draft Tracker · Lottery Sim · War Room · Hot Takes</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
