export interface RssEpisode {
  title: string;
  description: string;
  pubDate: string | null;
  guid: string;
  audioUrl: string;
  imageUrl: string | null;
  durationSeconds: number | null;
}

export interface RssFeed {
  title: string;
  description: string;
  author: string | null;
  imageUrl: string | null;
  websiteUrl: string | null;
  episodes: RssEpisode[];
}

export async function parseRssFeed(url: string): Promise<RssFeed> {
  const res = await fetch(url, {
    headers: { "User-Agent": "BKGrit-PodcastBot/1.0 (+https://bkgrit.com)" },
  });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();
  return parseRssXml(xml);
}

export function parseRssXml(xml: string): RssFeed {
  const channel = extract(xml, /<channel[^>]*>([\s\S]*?)<\/channel>/);
  if (!channel) throw new Error("No <channel> found in feed");

  const itemBlocks = [...channel.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/g)];
  const episodes: RssEpisode[] = itemBlocks
    .map((m) => parseItem(m[1]))
    .filter((ep): ep is RssEpisode => ep !== null);

  return {
    title: text(channel, /<title[^>]*>([\s\S]*?)<\/title>/) || "Untitled podcast",
    description: text(channel, /<description[^>]*>([\s\S]*?)<\/description>/) || "",
    author: text(channel, /<itunes:author[^>]*>([\s\S]*?)<\/itunes:author>/) || null,
    imageUrl: attr(channel, /<itunes:image\s[^>]*href="([^"]+)"/) || text(channel, /<image[^>]*>[\s\S]*?<url[^>]*>([\s\S]*?)<\/url>/),
    websiteUrl: text(channel, /<link[^>]*>([\s\S]*?)<\/link>/),
    episodes,
  };
}

function parseItem(block: string): RssEpisode | null {
  const title = text(block, /<title[^>]*>([\s\S]*?)<\/title>/);
  const audioUrl = attr(block, /<enclosure\s[^>]*url="([^"]+)"[^>]*>/);
  if (!title || !audioUrl) return null;
  const description =
    text(block, /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/) ||
    text(block, /<description[^>]*>([\s\S]*?)<\/description>/) ||
    "";
  return {
    title,
    description,
    pubDate: text(block, /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/),
    guid:
      text(block, /<guid[^>]*>([\s\S]*?)<\/guid>/) || audioUrl,
    audioUrl: cleanAudioUrl(audioUrl),
    imageUrl: attr(block, /<itunes:image\s[^>]*href="([^"]+)"/),
    durationSeconds: parseDuration(text(block, /<itunes:duration[^>]*>([\s\S]*?)<\/itunes:duration>/)),
  };
}

function extract(src: string, re: RegExp): string | null {
  const m = src.match(re);
  return m ? m[1] : null;
}

function text(src: string, re: RegExp): string | null {
  const raw = extract(src, re);
  if (!raw) return null;
  return decodeEntities(stripCdata(raw).trim());
}

function attr(src: string, re: RegExp): string | null {
  const m = src.match(re);
  return m ? decodeEntities(m[1]) : null;
}

function stripCdata(s: string): string {
  return s.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function cleanAudioUrl(url: string): string {
  return decodeEntities(url.split("?")[0].includes(".mp3") || url.split("?")[0].includes(".m4a")
    ? url
    : url);
}

function parseDuration(raw: string | null): number | null {
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return parseInt(raw, 10);
  const parts = raw.split(":").map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0];
}

export function detectSourceType(url: string): "youtube" | "rss" | "spotify" | "unknown" {
  const u = url.trim().toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("open.spotify.com")) return "spotify";
  if (u.endsWith(".xml") || u.endsWith(".rss") || u.includes("/rss") || u.includes("/feed") || u.includes("feeds.simplecast") || u.includes("anchor.fm/s/") || u.includes("feeds.megaphone") || u.includes("feeds.buzzsprout") || u.includes("rss.art19")) return "rss";
  return "unknown";
}
