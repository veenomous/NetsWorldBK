"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

const ALLOWED_UPLOADERS = ["veenomous", "jfrombk", "bkgrit"];

type ContentType = "space" | "podcast-episode" | "podcast-feed";
type Phase = "form" | "uploading" | "processing" | "ready" | "error";

interface Props {
  defaultType?: ContentType;
}

export default function UploadForm({ defaultType = "space" }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const xHandle = (session?.user as { xHandle?: string })?.xHandle || (session?.user?.name || "");
  const isAllowed =
    ALLOWED_UPLOADERS.some((h) => h.toLowerCase() === xHandle.toLowerCase()) ||
    xHandle.toLowerCase().includes("veenomous");

  const [contentType, setContentType] = useState<ContentType>(defaultType);

  const [spaceTitle, setSpaceTitle] = useState("");
  const [spaceOpponent, setSpaceOpponent] = useState("");
  const [spaceDate, setSpaceDate] = useState(new Date().toISOString().split("T")[0]);
  const [spaceFile, setSpaceFile] = useState<File | null>(null);

  const [podcastUrl, setPodcastUrl] = useState("");
  const [feedUrl, setFeedUrl] = useState("");

  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ link: string; label: string; message?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      if (contentType === "space") await submitSpace();
      else if (contentType === "podcast-episode") await submitPodcastEpisode();
      else await submitPodcastFeed();
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  async function submitSpace() {
    if (!spaceFile) throw new Error("Audio file required");
    if (!spaceTitle.trim()) throw new Error("Title required");

    setPhase("uploading");
    let durationMins = 0;

    try {
      const audio = new Audio();
      audio.src = URL.createObjectURL(spaceFile);
      await new Promise<void>((resolve) => {
        audio.addEventListener("loadedmetadata", () => {
          durationMins = Math.round(audio.duration / 60);
          resolve();
        });
        audio.addEventListener("error", () => resolve());
      });
    } catch {}

    const fileName = `${Date.now()}-${spaceFile.name.replace(/[^a-z0-9.]/gi, "-")}`;
    const { error: uploadError } = await supabase.storage.from("spaces-audio").upload(fileName, spaceFile);
    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
    const { data: urlData } = supabase.storage.from("spaces-audio").getPublicUrl(fileName);
    const audioUrl = urlData.publicUrl;

    setPhase("processing");
    const res = await fetch("/api/spaces/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: spaceTitle.trim(),
        opponent: spaceOpponent.trim() || null,
        date: spaceDate,
        audio_url: audioUrl,
        duration_mins: durationMins,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");

    setPhase("ready");
    setResult({
      link: `/spaces/${data.id}`,
      label: "View Space",
      message: "Transcribing in the background — check back in a few minutes.",
    });
  }

  async function submitPodcastEpisode() {
    if (!podcastUrl.trim()) throw new Error("YouTube URL required");
    setPhase("processing");
    const res = await fetch("/api/podcasts/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: podcastUrl.trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Ingest failed");
    setPhase("ready");
    setResult({
      link: `/podcasts/${data.show_slug}/${data.episode_slug}`,
      label: "View Episode",
      message: data.already_ingested
        ? "Already ingested — opening the existing page."
        : `${data.hot_moments_count ?? "Episode"} hot moments extracted.`,
    });
  }

  async function submitPodcastFeed() {
    if (!feedUrl.trim()) throw new Error("RSS feed URL required");
    setPhase("processing");
    const res = await fetch("/api/podcasts/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: feedUrl.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.source_type === "spotify_blocked") throw new Error(data.error);
      throw new Error(data.error || "Feed ingest failed");
    }
    setPhase("ready");
    setResult({
      link: `/podcasts/${data.show_slug}/${data.episode_slug}`,
      label: "View Episode",
      message:
        data.status === "transcribing"
          ? "Latest episode submitted to AssemblyAI. Transcription takes 3-5 minutes. Once done, call POST /api/podcasts/finalize with the episode ID, or hit the episode page to check status."
          : "Ingested.",
    });
  }

  if (!session) {
    return (
      <Shell>
        <p className="text-text-muted font-body text-center py-12">Sign in with X to upload.</p>
      </Shell>
    );
  }
  if (!isAllowed) {
    return (
      <Shell>
        <div className="text-center py-12">
          <p className="text-text-muted font-body">Upload access is restricted to trusted contributors.</p>
          <p className="text-text-muted/50 text-xs font-body mt-2">Signed in as: &quot;{xHandle}&quot;</p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {phase === "ready" && result ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-accent-green rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white text-2xl">check</span>
          </div>
          <p className="font-display font-black text-xl uppercase tracking-tight mb-2">Ingested.</p>
          {result.message && <p className="text-text-muted text-sm font-body mb-4 max-w-md mx-auto">{result.message}</p>}
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href={result.link}
              className="bg-brand-red text-white font-display font-bold text-sm uppercase tracking-wider px-8 py-3 hover:bg-brand-red/80 transition-colors inline-block"
            >
              {result.label}
            </Link>
            <button
              onClick={() => {
                setPhase("form");
                setResult(null);
              }}
              className="bg-bg-surface border border-black/10 text-text-primary font-display font-bold text-sm uppercase tracking-wider px-6 py-3 hover:border-brand-red/30 transition-colors"
            >
              Add Another
            </button>
          </div>
        </div>
      ) : phase === "error" ? (
        <div className="text-center py-12">
          <p className="font-display font-black text-lg uppercase tracking-tight text-brand-red mb-2">Error</p>
          <p className="text-text-muted text-sm font-body mb-4 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => {
              setPhase("form");
              setError("");
            }}
            className="bg-black text-white font-display font-bold text-xs uppercase tracking-wider px-6 py-2"
          >
            Try Again
          </button>
        </div>
      ) : phase !== "form" ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-display font-black text-lg uppercase tracking-tight">
            {phase === "uploading" ? "Uploading..." : "Processing..."}
          </p>
          <p className="text-text-muted text-sm font-body mt-2">
            {contentType === "podcast-episode" ? "Fetching captions and running Claude analysis" : "This can take a minute or two"}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Content type selector */}
          <div>
            <label className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-2 block">
              What are you adding?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <TypeButton active={contentType === "space"} onClick={() => setContentType("space")} icon="mic" label="Twitter Space" sub="Fan recording" />
              <TypeButton active={contentType === "podcast-episode"} onClick={() => setContentType("podcast-episode")} icon="podcasts" label="Podcast Episode" sub="YouTube URL" />
              <TypeButton active={contentType === "podcast-feed"} onClick={() => setContentType("podcast-feed")} icon="rss_feed" label="Podcast Feed" sub="RSS URL · ingests latest" />
            </div>
          </div>

          {contentType === "space" && (
            <>
              <Field label="Title *">
                <input
                  type="text"
                  required
                  value={spaceTitle}
                  onChange={(e) => setSpaceTitle(e.target.value)}
                  placeholder="Season Recap — End of 2025-26"
                  className="w-full border border-black/10 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red/50"
                />
              </Field>
              <Field label="Opponent / Topic">
                <input
                  type="text"
                  value={spaceOpponent}
                  onChange={(e) => setSpaceOpponent(e.target.value)}
                  placeholder="vs Toronto (season finale)"
                  className="w-full border border-black/10 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red/50"
                />
              </Field>
              <Field label="Date">
                <input
                  type="date"
                  value={spaceDate}
                  onChange={(e) => setSpaceDate(e.target.value)}
                  className="w-full border border-black/10 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red/50"
                />
              </Field>
              <Field label="Audio file *">
                <input
                  type="file"
                  accept=".mp3,.m4a,.wav,.webm,.ogg"
                  onChange={(e) => setSpaceFile(e.target.files?.[0] || null)}
                  className="w-full border border-black/10 px-4 py-3 font-body text-sm"
                />
                <p className="text-text-muted text-[10px] font-body mt-1">
                  MP3, M4A, WAV, WebM. Max ~100MB. X Spaces are audio-only — export the recording from X or your screen-recording tool.
                </p>
              </Field>
            </>
          )}

          {contentType === "podcast-episode" && (
            <Field label="YouTube URL *">
              <input
                type="url"
                required
                value={podcastUrl}
                onChange={(e) => setPodcastUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full border border-black/10 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red/50"
              />
              <p className="text-text-muted text-[10px] font-body mt-1">
                Pulls captions, runs Claude analysis, generates quote cards, cross-links to the wiki. Ready in ~30 seconds.
              </p>
            </Field>
          )}

          {contentType === "podcast-feed" && (
            <Field label="RSS Feed URL *">
              <input
                type="url"
                required
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                placeholder="https://feeds.simplecast.com/... or anchor.fm/s/.../podcast/rss"
                className="w-full border border-black/10 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red/50"
              />
              <p className="text-text-muted text-[10px] font-body mt-1">
                Ingests the latest episode via AssemblyAI (3-5 minutes). Spotify URLs don&apos;t work directly — find the RSS via Apple Podcasts or ask the host.
              </p>
            </Field>
          )}

          <button
            type="submit"
            className="bg-black text-white font-display font-bold text-xs uppercase tracking-wider px-8 py-3 hover:bg-brand-red transition-colors"
          >
            {contentType === "space" ? "Upload & Transcribe" : contentType === "podcast-episode" ? "Ingest Episode" : "Ingest Feed"}
          </button>
        </form>
      )}
    </Shell>
  );

  function Shell({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => router.back()}
              className="text-white/40 hover:text-white text-sm font-body"
            >
              &larr; Back
            </button>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight mt-4">
              Add to <span className="text-brand-red">Hot Mic</span>
            </h1>
            <p className="text-white/40 text-sm font-body mt-2 max-w-xl">
              Upload a Twitter Space, ingest a podcast from YouTube, or connect a full RSS feed. AI transcribes, extracts hot moments, and generates shareable clips.
            </p>
          </div>
        </div>
        <div className="h-1 bg-brand-red" />
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">{children}</div>
      </div>
    );
  }
}

function TypeButton({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border p-4 text-left transition-colors ${
        active ? "border-brand-red bg-brand-red/5" : "border-black/10 hover:border-brand-red/30"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`material-symbols-outlined text-base ${active ? "text-brand-red" : "text-text-muted"}`}
          style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {icon}
        </span>
        <span className={`font-display font-black text-xs uppercase tracking-tight ${active ? "text-text-primary" : "text-text-muted"}`}>
          {label}
        </span>
      </div>
      <p className="text-text-muted text-[10px] font-body">{sub}</p>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1.5 block">
        {label}
      </label>
      {children}
    </div>
  );
}
