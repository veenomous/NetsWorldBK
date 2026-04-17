import { createClient } from "@supabase/supabase-js";
import {
  slugify,
  transcriptForClaude,
  timestampToMs,
  CLAUDE_PROMPT,
  ClaudePodcastAnalysis,
  HotMoment,
  Chapter,
} from "./podcasts";
import { formatTimestamp, TranscriptSegment } from "./youtube";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const ASSEMBLYAI_KEY = process.env.ASSEMBLYAI_API_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function findOrCreatePodcast(args: {
  slug: string;
  name: string;
  channelUrl?: string;
  author?: string;
  thumbnailUrl?: string;
  websiteUrl?: string;
  rssUrl?: string;
}): Promise<string> {
  const { data: existing } = await supabase.from("podcasts").select("id").eq("slug", args.slug).maybeSingle();
  if (existing) {
    const updates: Record<string, string | null> = {};
    if (args.rssUrl) updates.rss_url = args.rssUrl;
    if (args.author) updates.author = args.author;
    if (args.thumbnailUrl) updates.thumbnail_url = args.thumbnailUrl;
    if (args.websiteUrl) updates.website_url = args.websiteUrl;
    if (Object.keys(updates).length) {
      await supabase.from("podcasts").update(updates).eq("id", existing.id);
    }
    return existing.id;
  }
  const { data: newShow, error } = await supabase
    .from("podcasts")
    .insert({
      slug: args.slug,
      name: args.name,
      channel_url: args.channelUrl || null,
      author: args.author || null,
      thumbnail_url: args.thumbnailUrl || null,
      website_url: args.websiteUrl || null,
      rss_url: args.rssUrl || null,
    })
    .select("id")
    .single();
  if (error || !newShow) throw new Error(`Failed to create podcast: ${error?.message}`);
  return newShow.id;
}

export async function existingEpisodeSlugs(podcastId: string): Promise<Set<string>> {
  const { data } = await supabase.from("podcast_episodes").select("slug").eq("podcast_id", podcastId);
  return new Set((data || []).map((r) => r.slug as string));
}

export function ensureUniqueSlug(existing: Set<string>, base: string): string {
  const safeBase = base || "episode";
  if (!existing.has(safeBase)) return safeBase;
  for (let i = 2; i < 100; i++) {
    const candidate = `${safeBase}-${i}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `${safeBase}-${Date.now()}`;
}

const ANALYZE_TOOL = {
  name: "save_podcast_analysis",
  description: "Save the structured analysis of a Brooklyn Nets podcast episode.",
  input_schema: {
    type: "object",
    properties: {
      summary: { type: "string", description: "3-5 sentence Nets-fan-focused summary." },
      hot_moments: {
        type: "array",
        description: "5-10 most shareable moments.",
        items: {
          type: "object",
          properties: {
            quote: { type: "string", description: "Exact quote from transcript, 1-3 sentences." },
            topic: { type: "string", description: "Brief topic label." },
            timestamp: { type: "string", description: "M:SS or H:MM:SS, must exist in transcript." },
            duration_sec: { type: "number", description: "15-60 seconds." },
            fire_level: { type: "number", description: "1-5." },
            context: { type: "string", description: "1 sentence of context." },
          },
          required: ["quote", "topic", "timestamp", "duration_sec", "fire_level", "context"],
        },
      },
      chapters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            timestamp: { type: "string" },
          },
          required: ["title", "timestamp"],
        },
      },
      tweet_thread: {
        type: "string",
        description: "One tweet per line, <280 chars each, 4-6 tweets, hook first.",
      },
      show_notes: { type: "string", description: "Markdown bullet list with timestamps." },
      topics: { type: "array", items: { type: "string" } },
    },
    required: ["summary", "hot_moments", "chapters", "tweet_thread", "show_notes", "topics"],
  },
} as const;

export async function analyzeWithClaude(
  transcript: TranscriptSegment[],
  title: string,
  show: string,
): Promise<ClaudePodcastAnalysis | null> {
  if (!ANTHROPIC_KEY) return null;
  const transcriptText = transcriptForClaude(transcript);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 8000,
      tools: [ANALYZE_TOOL],
      tool_choice: { type: "tool", name: ANALYZE_TOOL.name },
      messages: [{ role: "user", content: CLAUDE_PROMPT(transcriptText, { title, show }) }],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error("Claude error:", res.status, body.slice(0, 500));
    return null;
  }
  const data = await res.json();
  const toolUse = (data.content || []).find((c: { type: string }) => c.type === "tool_use");
  if (!toolUse) {
    console.error("Claude: no tool_use in response", JSON.stringify(data).slice(0, 400));
    return null;
  }
  return toolUse.input as ClaudePodcastAnalysis;
}

export async function finalizeEpisodeAnalysis(args: {
  episodeId: string;
  showName: string;
  title: string;
  transcript: TranscriptSegment[];
}): Promise<{ ok: true; hotMoments: number; summary: string } | { ok: false; error: string }> {
  const analysis = await analyzeWithClaude(args.transcript, args.title, args.showName);
  if (!analysis) {
    await supabase
      .from("podcast_episodes")
      .update({ status: "error", error_message: "Claude analysis failed" })
      .eq("id", args.episodeId);
    return { ok: false, error: "Claude analysis failed" };
  }

  const hotMoments = analysis.hot_moments.map((m) => ({
    ...m,
    timestamp_ms: timestampToMs((m as unknown as { timestamp: string }).timestamp),
    end_ms:
      timestampToMs((m as unknown as { timestamp: string }).timestamp) +
      ((m as unknown as { duration_sec?: number }).duration_sec || 30) * 1000,
  }));

  const chapters: Chapter[] = analysis.chapters.map((c) => ({
    title: c.title,
    start_ms: timestampToMs((c as unknown as { timestamp: string }).timestamp),
  }));

  await supabase
    .from("podcast_episodes")
    .update({
      summary: analysis.summary,
      hot_moments: hotMoments,
      chapters,
      tweet_thread: analysis.tweet_thread,
      show_notes: analysis.show_notes,
      status: "ready",
    })
    .eq("id", args.episodeId);

  await postHotMomentsToWire(args.episodeId, args.showName, hotMoments);

  return { ok: true, hotMoments: hotMoments.length, summary: analysis.summary };
}

export async function postHotMomentsToWire(
  episodeId: string,
  showName: string,
  moments: (HotMoment & { timestamp_ms: number })[],
): Promise<void> {
  const { data: existing } = await supabase
    .from("hot_takes")
    .select("id")
    .eq("podcast_episode_id", episodeId)
    .limit(1);
  if (existing && existing.length > 0) return;

  const rows = moments.map((m) => ({
    text: `"${m.quote}" — ${showName} [${formatTimestamp(m.timestamp_ms)}]`,
    author: `BKGrit · ${showName}`,
    tag: "Podcast",
    podcast_episode_id: episodeId,
    podcast_timestamp_ms: m.timestamp_ms,
    ip_hash: "system",
    agrees: 0,
    disagrees: 0,
  }));
  if (rows.length) {
    await supabase.from("hot_takes").insert(rows);
  }
}

export async function submitAssemblyAI(audioUrl: string): Promise<string | null> {
  if (!ASSEMBLYAI_KEY) return null;
  const res = await fetch("https://api.assemblyai.com/v2/transcript", {
    method: "POST",
    headers: { Authorization: ASSEMBLYAI_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ audio_url: audioUrl, speaker_labels: true }),
  });
  if (!res.ok) {
    console.error("AssemblyAI submit failed:", res.status, (await res.text()).slice(0, 300));
    return null;
  }
  const data = await res.json();
  return data.id || null;
}

export interface AaiStatus {
  state: "queued" | "processing" | "completed" | "error";
  errorMessage?: string;
  segments?: TranscriptSegment[];
}

export async function pollAssemblyAI(jobId: string): Promise<AaiStatus> {
  if (!ASSEMBLYAI_KEY) return { state: "error", errorMessage: "No AssemblyAI key" };
  const res = await fetch(`https://api.assemblyai.com/v2/transcript/${jobId}`, {
    headers: { Authorization: ASSEMBLYAI_KEY },
  });
  if (!res.ok) return { state: "error", errorMessage: `AssemblyAI ${res.status}` };
  const data = await res.json();
  if (data.status === "queued") return { state: "queued" };
  if (data.status === "processing") return { state: "processing" };
  if (data.status === "error") return { state: "error", errorMessage: data.error || "Transcription failed" };
  if (data.status === "completed") {
    const utterances = (data.utterances || []) as { text: string; start: number; end: number; speaker?: string }[];
    let segments: TranscriptSegment[];
    if (utterances.length > 0) {
      segments = utterances.map((u) => ({
        text: u.speaker ? `${u.speaker}: ${u.text}` : u.text,
        offsetMs: u.start,
        durationMs: u.end - u.start,
      }));
    } else {
      const words = (data.words || []) as { text: string; start: number; end: number }[];
      const chunks: TranscriptSegment[] = [];
      words.forEach((w, i) => {
        const ci = Math.floor(i / 20);
        if (!chunks[ci]) chunks[ci] = { text: "", offsetMs: w.start, durationMs: 0 };
        chunks[ci].text = (chunks[ci].text + " " + w.text).trim();
        chunks[ci].durationMs = w.end - chunks[ci].offsetMs;
      });
      segments = chunks;
    }
    return { state: "completed", segments };
  }
  return { state: "error", errorMessage: `Unknown status: ${data.status}` };
}

export { slugify };
