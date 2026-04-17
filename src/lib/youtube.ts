import { YoutubeTranscript } from "youtube-transcript";

export interface TranscriptSegment {
  text: string;
  offsetMs: number;
  durationMs: number;
}

export interface YouTubeMeta {
  videoId: string;
  title: string;
  channelName: string;
  channelUrl: string;
  thumbnailUrl: string;
}

export function extractVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function fetchTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const raw = await YoutubeTranscript.fetchTranscript(videoId);
  return raw.map((r) => ({
    text: decodeEntities(r.text),
    offsetMs: r.offset,
    durationMs: r.duration,
  }));
}

export async function fetchOEmbed(videoId: string): Promise<YouTubeMeta> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`oEmbed failed: ${res.status}`);
  const data = await res.json();
  return {
    videoId,
    title: data.title as string,
    channelName: data.author_name as string,
    channelUrl: data.author_url as string,
    thumbnailUrl: data.thumbnail_url as string,
  };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;#39;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;quot;/g, '"')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function formatTimestamp(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${String(m % 60).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}
