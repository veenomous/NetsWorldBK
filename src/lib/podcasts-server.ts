import { HotMoment, Chapter } from "./podcasts";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kijbuyyzetkxgcrphtjd.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export interface Podcast {
  id: string;
  slug: string;
  name: string;
  channel_url: string | null;
  thumbnail_url: string | null;
  description: string | null;
}

export interface PodcastEpisode {
  id: string;
  podcast_id: string;
  slug: string;
  youtube_id: string | null;
  source_url: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  published_at: string | null;
  transcript: { text: string; offsetMs: number; durationMs: number }[] | null;
  summary: string | null;
  hot_moments: HotMoment[] | null;
  chapters: Chapter[] | null;
  tweet_thread: string | null;
  show_notes: string | null;
  status: string;
  created_at: string;
  podcasts?: Podcast;
}

async function sbFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function getAllPodcasts(): Promise<Podcast[]> {
  return sbFetch<Podcast[]>(`podcasts?select=*&order=name.asc`);
}

export interface SpaceSummary {
  id: string;
  title: string;
  opponent: string | null;
  date: string;
  duration_mins: number;
  status: string;
  speaker_count: number;
  summary: string | null;
  created_at: string;
}

export async function getRecentSpaces(limit = 10): Promise<SpaceSummary[]> {
  return sbFetch<SpaceSummary[]>(
    `spaces?select=id,title,opponent,date,duration_mins,status,speaker_count,summary,created_at&order=date.desc&limit=${limit}`,
  );
}

export interface HotMomentRow {
  episode_id: string;
  episode_slug: string;
  episode_title: string;
  show_slug: string;
  show_name: string;
  thumbnail_url: string | null;
  quote: string;
  topic: string;
  fire_level: number;
  timestamp_ms: number;
  idx: number;
}

export async function getTopHotMoments(limit = 6): Promise<HotMomentRow[]> {
  const eps = await sbFetch<{
    id: string;
    slug: string;
    title: string;
    thumbnail_url: string | null;
    hot_moments: { quote: string; topic: string; fire_level: number; timestamp_ms: number }[] | null;
    podcasts: { slug: string; name: string };
  }[]>(`podcast_episodes?select=id,slug,title,thumbnail_url,hot_moments,podcasts(slug,name)&status=eq.ready&order=created_at.desc&limit=20`);

  const flat: HotMomentRow[] = [];
  for (const ep of eps) {
    if (!ep.hot_moments) continue;
    ep.hot_moments.forEach((m, idx) => {
      flat.push({
        episode_id: ep.id,
        episode_slug: ep.slug,
        episode_title: ep.title,
        show_slug: ep.podcasts.slug,
        show_name: ep.podcasts.name,
        thumbnail_url: ep.thumbnail_url,
        quote: m.quote,
        topic: m.topic,
        fire_level: m.fire_level,
        timestamp_ms: m.timestamp_ms,
        idx,
      });
    });
  }
  return flat.sort((a, b) => b.fire_level - a.fire_level).slice(0, limit);
}

export async function getHotMicStats(): Promise<{ shows: number; episodes: number; spaces: number; hotMoments: number }> {
  const [shows, episodes, spaces, eps] = await Promise.all([
    sbFetch<{ id: string }[]>(`podcasts?select=id`),
    sbFetch<{ id: string }[]>(`podcast_episodes?select=id&status=eq.ready`),
    sbFetch<{ id: string }[]>(`spaces?select=id&status=eq.ready`),
    sbFetch<{ hot_moments: unknown[] | null }[]>(`podcast_episodes?select=hot_moments&status=eq.ready`),
  ]);
  const hotMoments = eps.reduce((acc, e) => acc + (Array.isArray(e.hot_moments) ? e.hot_moments.length : 0), 0);
  return { shows: shows.length, episodes: episodes.length, spaces: spaces.length, hotMoments };
}

export async function getPodcastBySlug(slug: string): Promise<Podcast | null> {
  const rows = await sbFetch<Podcast[]>(`podcasts?slug=eq.${slug}&select=*`);
  return rows[0] || null;
}

export async function getEpisodesByPodcast(podcastId: string): Promise<PodcastEpisode[]> {
  return sbFetch<PodcastEpisode[]>(
    `podcast_episodes?podcast_id=eq.${podcastId}&status=eq.ready&select=*&order=created_at.desc`,
  );
}

export async function getRecentEpisodes(limit = 12): Promise<PodcastEpisode[]> {
  return sbFetch<PodcastEpisode[]>(
    `podcast_episodes?status=eq.ready&select=*,podcasts(*)&order=created_at.desc&limit=${limit}`,
  );
}

export async function getEpisode(showSlug: string, episodeSlug: string): Promise<PodcastEpisode | null> {
  const podcast = await getPodcastBySlug(showSlug);
  if (!podcast) return null;
  const rows = await sbFetch<PodcastEpisode[]>(
    `podcast_episodes?podcast_id=eq.${podcast.id}&slug=eq.${episodeSlug}&select=*,podcasts(*)`,
  );
  return rows[0] || null;
}
