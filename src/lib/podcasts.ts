import { TranscriptSegment, formatTimestamp } from "./youtube";
import { getAllArticles } from "./kb";

export interface HotMoment {
  quote: string;
  topic: string;
  timestamp_ms: number;
  end_ms: number;
  fire_level: 1 | 2 | 3 | 4 | 5;
  context: string;
}

export interface Chapter {
  title: string;
  start_ms: number;
}

export interface ClaudePodcastAnalysis {
  summary: string;
  hot_moments: HotMoment[];
  chapters: Chapter[];
  tweet_thread: string;
  show_notes: string;
  topics: string[];
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

export function isThrowback(createdAt: string, publishedAt: string | null): boolean {
  if (!publishedAt) return false;
  const created = new Date(createdAt).getTime();
  const published = new Date(publishedAt).getTime();
  if (!created || !published) return false;
  return created - published > 30 * 24 * 60 * 60 * 1000;
}

export function episodeDisplayDate(createdAt: string, publishedAt: string | null): string {
  return publishedAt || createdAt;
}

export function channelUrlToSlug(channelUrl: string, channelName: string): string {
  const handleMatch = channelUrl.match(/\/@([^/?#]+)/);
  if (handleMatch) return slugify(handleMatch[1]);
  return slugify(channelName);
}

export function transcriptForClaude(segments: TranscriptSegment[]): string {
  return segments
    .map((s) => `[${formatTimestamp(s.offsetMs)}] ${s.text}`)
    .join("\n");
}

export function timestampToMs(timestamp: string): number {
  const parts = timestamp.split(":").map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) return 0;
  if (parts.length === 3) return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
  if (parts.length === 2) return (parts[0] * 60 + parts[1]) * 1000;
  return parts[0] * 1000;
}

export interface WikiLinkMatch {
  slug: string;
  category: string;
  title: string;
  timestamp_ms: number;
  matched_text: string;
}

const STOPWORDS = new Set(["nets", "brooklyn", "brooklyn nets", "nba"]);

export function detectWikiLinks(segments: TranscriptSegment[]): WikiLinkMatch[] {
  const articles = getAllArticles();
  const matches = new Map<string, WikiLinkMatch>();

  for (const article of articles) {
    const candidates = [article.title];
    const lastName = article.title.split(" ").slice(-1)[0];
    if (lastName && lastName.length > 4 && article.title.includes(" ")) {
      candidates.push(lastName);
    }

    for (const candidate of candidates) {
      const lower = candidate.toLowerCase();
      if (STOPWORDS.has(lower) || lower.length < 4) continue;
      const pattern = new RegExp(`\\b${escapeRegex(candidate)}\\b`, "i");

      for (const seg of segments) {
        if (pattern.test(seg.text)) {
          const key = article.slug;
          if (!matches.has(key) || matches.get(key)!.timestamp_ms > seg.offsetMs) {
            matches.set(key, {
              slug: article.slug,
              category: article.category,
              title: article.title,
              timestamp_ms: seg.offsetMs,
              matched_text: candidate,
            });
          }
          break;
        }
      }
    }
  }

  return Array.from(matches.values()).sort((a, b) => a.timestamp_ms - b.timestamp_ms);
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const CLAUDE_PROMPT = (transcriptText: string, meta: { title: string; show: string }) => `You are analyzing a Brooklyn Nets podcast episode transcript for BKGrit, a Nets-specific knowledge platform. The transcript is auto-generated from YouTube captions — it may misspell proper nouns (e.g. "Shawn Marks" should be "Sean Marks"). Fix obvious errors silently.

Episode: "${meta.title}"
Show: ${meta.show}

Transcript (timestamps in [M:SS] or [H:MM:SS]):
${transcriptText}

Return a JSON object with:

{
  "summary": "3-5 sentence summary of what was discussed, Nets-fan-focused",
  "hot_moments": [
    {
      "quote": "the most shareable exact quote, 1-3 sentences, punchy and standalone",
      "topic": "brief topic label (e.g. 'MPJ Trade', 'Rebuild Timeline')",
      "timestamp": "M:SS",
      "duration_sec": 15-60,
      "fire_level": 1-5,
      "context": "1 sentence of context so the quote isn't stranded"
    }
  ],
  "chapters": [
    { "title": "chapter title", "timestamp": "M:SS" }
  ],
  "tweet_thread": "Pre-written Twitter thread, one tweet per line, each <280 chars, written as if from the podcast host promoting the episode. Start with a hook tweet. 4-6 tweets total.",
  "show_notes": "Markdown show notes: bullet list of main topics with timestamps. Conversational but scannable.",
  "topics": ["array", "of", "key", "topics"]
}

Rules:
- Pick 5-10 hot_moments. Favor moments that are self-contained, surprising, or spicy.
- fire_level: 5 = genuinely hot/controversial, 3 = interesting, 1 = informative.
- timestamps must exist in the transcript.
- Every quote must be a real phrase from the transcript (minor cleanup for readability is ok — fix "Shawn" to "Sean", trim filler words — but do not fabricate).
- Tweet thread should make a fan want to listen to the episode.
- Be Nets-first in framing. This is for Nets fans.

Return ONLY valid JSON. No markdown fences, no commentary.`;
