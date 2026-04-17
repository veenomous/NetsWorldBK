import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractVideoId, fetchTranscript } from "@/lib/youtube";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpamJ1eXl6ZXRreGdjcnBodGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMzg2NTksImV4cCI6MjA4OTkxNDY1OX0.8qJe14118lGBo_QsZ5_VAm00NmIbnGraeteQGRiWyeU";
const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function isYoutubeUrl(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes("youtube.com/") || u.includes("youtu.be/");
}

export async function POST(req: NextRequest) {
  try {
    const { title, opponent, date, audio_url, duration_mins } = await req.json();

    if (!title || !audio_url) {
      return NextResponse.json({ error: "Title and audio_url required" }, { status: 400 });
    }

    if (isYoutubeUrl(audio_url)) {
      return await handleYouTubeSpace({ title, opponent, date, url: audio_url });
    }

    const { data: space, error: insertError } = await supabase
      .from("spaces")
      .insert({
        title,
        opponent: opponent || null,
        date: date || new Date().toISOString().split("T")[0],
        duration_mins: duration_mins || 0,
        audio_url,
        status: "processing",
      })
      .select("id")
      .single();

    if (insertError || !space) {
      return NextResponse.json({ error: insertError?.message || "Failed to create space" }, { status: 500 });
    }

    if (ASSEMBLYAI_KEY) {
      const aaiRes = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: { Authorization: ASSEMBLYAI_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ audio_url, speaker_labels: true }),
      });

      if (aaiRes.ok) {
        const aaiData = await aaiRes.json();
        await supabase.from("spaces").update({ transcript: { assemblyai_id: aaiData.id } }).eq("id", space.id);
      } else {
        await supabase.from("spaces").update({ status: "error" }).eq("id", space.id);
      }
    } else {
      await supabase
        .from("spaces")
        .update({ status: "error", summary: "AssemblyAI API key not configured" })
        .eq("id", space.id);
    }

    return NextResponse.json({ id: space.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg || "Server error" }, { status: 500 });
  }
}

async function handleYouTubeSpace(args: { title: string; opponent?: string; date?: string; url: string }) {
  const videoId = extractVideoId(args.url);
  if (!videoId) {
    return NextResponse.json({ error: "Could not extract YouTube video ID" }, { status: 400 });
  }

  let transcript;
  try {
    transcript = await fetchTranscript(videoId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Captions unavailable: ${msg}` }, { status: 422 });
  }
  if (!transcript.length) {
    return NextResponse.json({ error: "No captions on this video" }, { status: 422 });
  }

  const utterances = transcript.map((seg) => ({
    speaker: "A",
    text: seg.text,
    start: seg.offsetMs,
    end: seg.offsetMs + seg.durationMs,
  }));

  const totalDurationMs = transcript[transcript.length - 1].offsetMs + (transcript[transcript.length - 1].durationMs || 0);
  const durationMins = Math.round(totalDurationMs / 60000);

  const { data: space, error: insertError } = await supabase
    .from("spaces")
    .insert({
      title: args.title,
      opponent: args.opponent || null,
      date: args.date || new Date().toISOString().split("T")[0],
      duration_mins: durationMins,
      audio_url: args.url,
      transcript: utterances,
      speaker_count: 1,
      status: "transcribed",
    })
    .select("id")
    .single();

  if (insertError || !space) {
    return NextResponse.json({ error: insertError?.message || "Failed to create space" }, { status: 500 });
  }

  await supabase.from("space_speakers").insert({ space_id: space.id, speaker_label: "A" });

  const analysis = await summarizeSpaceWithClaude(utterances, args.title);
  if (analysis) {
    await supabase
      .from("spaces")
      .update({ summary: analysis.summary, hot_moments: analysis.hot_moments, status: "ready" })
      .eq("id", space.id);
    for (const moment of analysis.hot_moments) {
      await supabase.from("hot_takes").insert({
        text: `"${moment.quote}" — ${args.title} [${formatTs(moment.timestamp_ms)}]`,
        author: "BKGrit Spaces",
        tag: "Spaces",
        space_id: space.id,
        ip_hash: "system",
        agrees: 0,
        disagrees: 0,
      });
    }
  } else {
    await supabase.from("spaces").update({ status: "ready" }).eq("id", space.id);
  }

  return NextResponse.json({ id: space.id });
}

function formatTs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

interface SpaceAnalysis {
  summary: string;
  hot_moments: { quote: string; speaker: string; timestamp_ms: number; topic: string; fire_level: number }[];
  topics: string[];
}

async function summarizeSpaceWithClaude(
  utterances: { speaker: string; text: string; start: number }[],
  title: string,
): Promise<SpaceAnalysis | null> {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
  if (!ANTHROPIC_KEY) return null;
  const text = utterances.map((u) => `[${formatTs(u.start)}] ${u.text}`).join("\n");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      tools: [
        {
          name: "save_space_analysis",
          description: "Save a summary and hot moments for a Brooklyn Nets fan discussion.",
          input_schema: {
            type: "object",
            properties: {
              summary: { type: "string", description: "3-5 sentence summary of the discussion." },
              hot_moments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    quote: { type: "string" },
                    speaker: { type: "string", description: "Leave as 'A' for single-track captions." },
                    timestamp_ms: { type: "number" },
                    topic: { type: "string" },
                    fire_level: { type: "number" },
                  },
                  required: ["quote", "speaker", "timestamp_ms", "topic", "fire_level"],
                },
              },
              topics: { type: "array", items: { type: "string" } },
            },
            required: ["summary", "hot_moments", "topics"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "save_space_analysis" },
      messages: [
        {
          role: "user",
          content: `Analyze this Brooklyn Nets post-game fan discussion titled "${title}". Single-speaker YouTube captions, so all speaker fields = "A". Provide summary and 5 hot moments (timestamp_ms in milliseconds, fire_level 1-5).\n\nTranscript:\n${text}`,
        },
      ],
    }),
  });
  if (!res.ok) {
    console.error("Claude (spaces) error:", res.status, (await res.text()).slice(0, 300));
    return null;
  }
  const data = await res.json();
  const toolUse = (data.content || []).find((c: { type: string }) => c.type === "tool_use");
  return (toolUse?.input as SpaceAnalysis) || null;
}
