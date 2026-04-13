import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU";
const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function formatTimestamp(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const spaceId = req.nextUrl.searchParams.get("id");
  if (!spaceId) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    // 1. Get space record
    const { data: space } = await supabase
      .from("spaces")
      .select("*")
      .eq("id", spaceId)
      .single();

    if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });
    if (space.status === "ready") return NextResponse.json({ status: "ready", space });
    if (space.status === "error") return NextResponse.json({ status: "error", space });

    const aaiId = space.transcript?.assemblyai_id;
    if (!aaiId) return NextResponse.json({ status: "error", message: "No transcription job" });

    // 2. Poll AssemblyAI
    const aaiRes = await fetch(`https://api.assemblyai.com/v2/transcript/${aaiId}`, {
      headers: { Authorization: ASSEMBLYAI_KEY },
    });

    if (!aaiRes.ok) {
      return NextResponse.json({ status: "error", message: "AssemblyAI request failed" });
    }

    const aaiData = await aaiRes.json();

    if (aaiData.status === "queued" || aaiData.status === "processing") {
      return NextResponse.json({ status: "processing" });
    }

    if (aaiData.status === "error") {
      await supabase.from("spaces").update({ status: "error", summary: aaiData.error || "Transcription failed" }).eq("id", spaceId);
      return NextResponse.json({ status: "error", message: aaiData.error });
    }

    if (aaiData.status === "completed") {
      // 3. Parse utterances into transcript
      const utterances = (aaiData.utterances || []).map((u: any) => ({
        speaker: u.speaker,
        text: u.text,
        start: u.start,
        end: u.end,
      }));

      // Count unique speakers
      const speakers = [...new Set(utterances.map((u: any) => u.speaker))];

      // Save transcript
      await supabase.from("spaces").update({
        transcript: utterances,
        speaker_count: speakers.length,
        status: "transcribed",
      }).eq("id", spaceId);

      // Create speaker entries
      for (const speaker of speakers) {
        await supabase.from("space_speakers").insert({
          space_id: spaceId,
          speaker_label: speaker,
        });
      }

      // 4. Claude summarization
      let summary = "";
      let hotMoments: any[] = [];

      if (ANTHROPIC_KEY) {
        const transcriptText = utterances
          .map((u: any) => `[${formatTimestamp(u.start)}] ${u.speaker}: ${u.text}`)
          .join("\n");

        try {
          const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": ANTHROPIC_KEY,
              "anthropic-version": "2023-06-01",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 2000,
              messages: [{
                role: "user",
                content: `You are analyzing a post-game Brooklyn Nets fan discussion from an X Space. Here is the transcript:\n\n${transcriptText}\n\nProvide a JSON response with:\n1. "summary": A 3-5 sentence summary of the discussion\n2. "hot_moments": Array of the 5 most interesting/heated/funny moments, each with: { "quote": "exact quote", "speaker": "Speaker A/B/etc", "timestamp_ms": number, "topic": "brief topic", "fire_level": 1-5 }\n3. "topics": Array of key topics discussed (strings)\n\nReturn ONLY valid JSON, no markdown.`,
              }],
            }),
          });

          if (claudeRes.ok) {
            const claudeData = await claudeRes.json();
            const content = claudeData.content?.[0]?.text || "";
            try {
              const parsed = JSON.parse(content);
              summary = parsed.summary || "";
              hotMoments = parsed.hot_moments || [];

              // Save summary and hot moments
              await supabase.from("spaces").update({
                summary,
                hot_moments: hotMoments,
                status: "ready",
              }).eq("id", spaceId);

              // Post hot moments to The Wire
              for (const moment of hotMoments) {
                await supabase.from("hot_takes").insert({
                  text: `"${moment.quote}" — ${moment.speaker} [${formatTimestamp(moment.timestamp_ms)}]`,
                  author: "BKGrit Spaces",
                  tag: "Spaces",
                  space_id: spaceId,
                  ip_hash: "system",
                  agrees: 0,
                  disagrees: 0,
                });
              }
            } catch {
              // JSON parse failed — save summary as raw text
              summary = content.slice(0, 500);
              await supabase.from("spaces").update({ summary, status: "ready" }).eq("id", spaceId);
            }
          } else {
            // Claude failed — still mark as ready (transcript is there)
            await supabase.from("spaces").update({ status: "ready" }).eq("id", spaceId);
          }
        } catch {
          await supabase.from("spaces").update({ status: "ready" }).eq("id", spaceId);
        }
      } else {
        // No Anthropic key — mark as ready without summary
        await supabase.from("spaces").update({ status: "ready" }).eq("id", spaceId);
      }

      // Fetch final state
      const { data: finalSpace } = await supabase.from("spaces").select("*").eq("id", spaceId).single();
      return NextResponse.json({ status: "ready", space: finalSpace });
    }

    return NextResponse.json({ status: "processing" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
