/**
 * YouTube Transcript Fetcher for BKGrit Knowledge Base
 *
 * Fetches recent videos from Nets-related YouTube channels,
 * extracts key info, and writes to kb/raw/media/.
 *
 * Usage: npx tsx scripts/fetch-youtube.ts
 *
 * Note: YouTube doesn't provide transcripts via public API without auth.
 * This fetcher pulls video metadata (title, description) from RSS feeds
 * that YouTube channels provide. For full transcripts, use the /youtube
 * skill manually with specific video URLs.
 *
 * Agent tier: Haiku (data extraction)
 */

import fs from "fs";
import path from "path";

const KB_RAW = path.join(process.cwd(), "kb", "raw", "media");
const TODAY = new Date().toISOString().split("T")[0];

// YouTube channel RSS feeds
// To find a channel ID: go to the channel page → View Page Source → search for "channelId"
// Or use: https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
//
// UPDATE THESE with real channel IDs when discovered:
const CHANNELS = [
  {
    name: "Locked On Nets",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCVNZbbTJDQHfOlWGOibVZgg",
  },
  {
    name: "Brooklyn Nets",
    url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCiCRRShMcMYGOQpS4hLKMwQ",
  },
];

// Keywords to filter for Nets-relevant content
const KEYWORDS = [
  "nets", "brooklyn", "demin", "claxton", "clowney", "traore",
  "porter", "mpj", "draft", "rebuild", "giannis", "trade",
  "lottery", "barclays",
];

interface YouTubeEntry {
  title: string;
  videoId: string;
  published: string;
  description: string;
}

function parseYouTubeFeed(xml: string): YouTubeEntry[] {
  const entries: YouTubeEntry[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];

    const getTag = (tag: string): string => {
      const tagMatch = entryXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return tagMatch ? tagMatch[1].trim() : "";
    };

    const videoIdMatch = entryXml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const videoId = videoIdMatch ? videoIdMatch[1] : "";

    entries.push({
      title: getTag("title"),
      videoId,
      published: getTag("published").split("T")[0],
      description: getTag("media:description") || getTag("content"),
    });
  }

  return entries;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60).replace(/-$/, "");
}

function isRelevant(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  return KEYWORDS.some(kw => text.includes(kw));
}

async function main() {
  console.log(`\n🎥 BKGrit YouTube Monitor — ${TODAY}\n`);

  if (!fs.existsSync(KB_RAW)) fs.mkdirSync(KB_RAW, { recursive: true });

  let totalWritten = 0;

  for (const channel of CHANNELS) {
    console.log(`  Fetching ${channel.name}...`);

    try {
      const res = await fetch(channel.url, {
        headers: { "User-Agent": "BKGrit-KB-Bot/1.0" },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        console.log(`    ⚠ ${res.status} — skipping`);
        continue;
      }

      const xml = await res.text();
      const entries = parseYouTubeFeed(xml);

      // Filter for recent + relevant
      const recent = entries
        .filter(e => {
          const daysAgo = (Date.now() - new Date(e.published).getTime()) / 86400000;
          return daysAgo <= 7; // Last 7 days
        })
        .filter(e => isRelevant(e.title, e.description));

      if (recent.length === 0) {
        console.log(`    No recent Nets content (${entries.length} total videos)`);
        continue;
      }

      for (const entry of recent.slice(0, 3)) {
        const slug = slugify(entry.title);
        const filename = `${TODAY}-yt-${slug}.md`;
        const filePath = path.join(KB_RAW, filename);

        if (fs.existsSync(filePath)) continue;

        const url = `https://www.youtube.com/watch?v=${entry.videoId}`;

        const md = `---
title: "${entry.title.replace(/"/g, '\\"')}"
tags: [youtube, video, ${channel.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}]
source_url: ${url}
source_type: video
clipped_date: ${entry.published}
---

## Key Takeaways
- ${entry.title}

## Description
${entry.description ? entry.description.slice(0, 500) : "No description available."}

## Source
- Channel: ${channel.name}
- URL: ${url}
- Published: ${entry.published}

## Notes
Full transcript can be extracted using: /youtube ${url}
`;

        fs.writeFileSync(filePath, md);
        console.log(`    ✓ ${filename}`);
        totalWritten++;
      }
    } catch (err: any) {
      console.log(`    ⚠ Error: ${err.message || err}`);
    }
  }

  console.log(`\n✅ YouTube fetch complete. ${totalWritten} new video(s) saved.\n`);
}

main();
