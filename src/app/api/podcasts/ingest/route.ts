import { NextRequest, NextResponse } from "next/server";
import { extractVideoId, fetchTranscript, fetchOEmbed } from "@/lib/youtube";
import { channelUrlToSlug, slugify, HotMoment } from "@/lib/podcasts";
import { parseRssFeed, detectSourceType } from "@/lib/rss";
import {
  supabase,
  findOrCreatePodcast,
  existingEpisodeSlugs,
  ensureUniqueSlug,
  finalizeEpisodeAnalysis,
  postHotMomentsToWire,
  submitAssemblyAI,
} from "@/lib/podcasts-ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { url, episode_index: epIdxRaw } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    const sourceType = detectSourceType(url);

    if (sourceType === "youtube") {
      return await ingestYouTube(url);
    }

    if (sourceType === "rss") {
      const episodeIndex = typeof epIdxRaw === "number" ? epIdxRaw : 0;
      return await ingestRss(url, episodeIndex);
    }

    if (sourceType === "spotify") {
      return NextResponse.json(
        {
          error:
            "Spotify URLs aren't directly supported — Spotify hides audio. Paste the podcast's RSS feed URL instead. Ask the host, or find it via castos.com/tools/find-podcast-rss-feed. If the show is also on Apple Podcasts, the RSS is visible there.",
          source_type: "spotify_blocked",
        },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { error: `Unrecognized URL type. Paste a YouTube watch URL or a podcast RSS feed URL.` },
      { status: 400 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg || "Server error" }, { status: 500 });
  }
}

async function ingestYouTube(url: string) {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: "Could not extract YouTube video ID" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("podcast_episodes")
    .select("id, slug, status, hot_moments, podcasts(slug, name)")
    .eq("youtube_id", videoId)
    .maybeSingle();
  let retryEpisodeId: string | null = null;
  if (existing) {
    const existingTyped = existing as unknown as {
      id: string;
      slug: string;
      status: string;
      hot_moments: HotMoment[] | null;
      podcasts: { slug: string; name: string };
    };
    if (existingTyped.status === "ready") {
      if (existingTyped.hot_moments?.length) {
        await postHotMomentsToWire(existingTyped.id, existingTyped.podcasts.name, existingTyped.hot_moments);
      }
      return NextResponse.json({
        id: existingTyped.id,
        show_slug: existingTyped.podcasts.slug,
        episode_slug: existingTyped.slug,
        status: existingTyped.status,
        already_ingested: true,
      });
    }
    retryEpisodeId = existingTyped.id;
  }

  const meta = await fetchOEmbed(videoId);

  let transcript;
  try {
    transcript = await fetchTranscript(videoId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Transcript unavailable: ${msg}` }, { status: 422 });
  }
  if (!transcript.length) {
    return NextResponse.json({ error: "Transcript is empty" }, { status: 422 });
  }

  const showSlug = channelUrlToSlug(meta.channelUrl, meta.channelName);
  const podcastId = await findOrCreatePodcast({
    slug: showSlug,
    name: meta.channelName,
    channelUrl: meta.channelUrl,
  });

  const totalDurationMs = transcript[transcript.length - 1]?.offsetMs + (transcript[transcript.length - 1]?.durationMs || 0);

  let episodeId: string;
  let episodeSlug: string;

  if (retryEpisodeId) {
    const { data: row } = await supabase.from("podcast_episodes").select("slug").eq("id", retryEpisodeId).single();
    episodeId = retryEpisodeId;
    episodeSlug = row?.slug || slugify(meta.title);
    await supabase
      .from("podcast_episodes")
      .update({ transcript, status: "processing", error_message: null, source_type: "youtube" })
      .eq("id", episodeId);
  } else {
    episodeSlug = ensureUniqueSlug(await existingEpisodeSlugs(podcastId), slugify(meta.title));
    const { data: episode, error: insertErr } = await supabase
      .from("podcast_episodes")
      .insert({
        podcast_id: podcastId,
        slug: episodeSlug,
        youtube_id: videoId,
        source_url: `https://www.youtube.com/watch?v=${videoId}`,
        source_type: "youtube",
        title: meta.title,
        thumbnail_url: meta.thumbnailUrl,
        duration_seconds: Math.round(totalDurationMs / 1000),
        transcript,
        status: "processing",
      })
      .select("id")
      .single();
    if (insertErr || !episode) {
      return NextResponse.json({ error: `Insert failed: ${insertErr?.message}` }, { status: 500 });
    }
    episodeId = episode.id;
  }

  const result = await finalizeEpisodeAnalysis({
    episodeId,
    showName: meta.channelName,
    title: meta.title,
    transcript,
  });
  if (!result.ok) {
    return NextResponse.json(
      { id: episodeId, show_slug: showSlug, episode_slug: episodeSlug, status: "error", error: result.error },
      { status: 502 },
    );
  }

  return NextResponse.json({
    id: episodeId,
    show_slug: showSlug,
    episode_slug: episodeSlug,
    status: "ready",
    summary: result.summary,
    hot_moments_count: result.hotMoments,
  });
}

async function ingestRss(url: string, episodeIndex: number) {
  let feed;
  try {
    feed = await parseRssFeed(url);
  } catch (e) {
    return NextResponse.json(
      { error: `RSS fetch failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 422 },
    );
  }

  if (!feed.episodes.length) {
    return NextResponse.json({ error: "RSS feed has no episodes" }, { status: 422 });
  }

  const ep = feed.episodes[Math.max(0, Math.min(episodeIndex, feed.episodes.length - 1))];

  const showSlug = slugify(feed.title);
  const podcastId = await findOrCreatePodcast({
    slug: showSlug,
    name: feed.title,
    author: feed.author || undefined,
    thumbnailUrl: feed.imageUrl || undefined,
    websiteUrl: feed.websiteUrl || undefined,
    rssUrl: url,
  });

  const { data: existing } = await supabase
    .from("podcast_episodes")
    .select("id, slug, status, hot_moments, podcasts(slug, name)")
    .eq("podcast_id", podcastId)
    .eq("source_url", ep.audioUrl)
    .maybeSingle();
  if (existing) {
    const t = existing as unknown as {
      id: string;
      slug: string;
      status: string;
      hot_moments: HotMoment[] | null;
      podcasts: { slug: string; name: string };
    };
    if (t.status === "ready" && t.hot_moments?.length) {
      await postHotMomentsToWire(t.id, t.podcasts.name, t.hot_moments);
    }
    return NextResponse.json({
      id: t.id,
      show_slug: t.podcasts.slug,
      episode_slug: t.slug,
      status: t.status,
      already_ingested: true,
    });
  }

  const episodeSlug = ensureUniqueSlug(await existingEpisodeSlugs(podcastId), slugify(ep.title));

  const assemblyaiId = await submitAssemblyAI(ep.audioUrl);
  if (!assemblyaiId) {
    return NextResponse.json({ error: "AssemblyAI submission failed — is ASSEMBLYAI_API_KEY set?" }, { status: 500 });
  }

  const { data: episode, error: insertErr } = await supabase
    .from("podcast_episodes")
    .insert({
      podcast_id: podcastId,
      slug: episodeSlug,
      source_url: ep.audioUrl,
      source_type: "rss",
      audio_url: ep.audioUrl,
      title: ep.title,
      description: ep.description.slice(0, 2000) || null,
      thumbnail_url: ep.imageUrl || feed.imageUrl,
      duration_seconds: ep.durationSeconds,
      published_at: ep.pubDate ? new Date(ep.pubDate).toISOString() : null,
      assemblyai_id: assemblyaiId,
      status: "transcribing",
    })
    .select("id")
    .single();
  if (insertErr || !episode) {
    return NextResponse.json({ error: `Insert failed: ${insertErr?.message}` }, { status: 500 });
  }

  return NextResponse.json({
    id: episode.id,
    show_slug: showSlug,
    episode_slug: episodeSlug,
    status: "transcribing",
    assemblyai_id: assemblyaiId,
    message: `Transcribing via AssemblyAI. Call POST /api/podcasts/finalize with { id: "${episode.id}" } after a few minutes to complete analysis.`,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "POST { url }",
    supported_sources: ["YouTube watch URL", "Podcast RSS feed URL"],
    not_supported: ["Spotify show URLs directly — ask host for RSS, or find via Apple Podcasts"],
  });
}
