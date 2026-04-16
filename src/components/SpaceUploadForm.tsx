"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

const ALLOWED_UPLOADERS = ["veenomous", "jfrombk", "bkgrit"]; // Add trusted handles here

type UploadPhase = "form" | "uploading" | "transcribing" | "summarizing" | "ready" | "error";

export default function SpaceUploadForm() {
  const { data: session } = useSession();
  const xHandle = (session?.user as { xHandle?: string })?.xHandle || (session?.user?.name || "");

  const [title, setTitle] = useState("");
  const [opponent, setOpponent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sourceType, setSourceType] = useState<"file" | "youtube">("file");
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [phase, setPhase] = useState<UploadPhase>("form");
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isAllowed = ALLOWED_UPLOADERS.some(h => h.toLowerCase() === xHandle.toLowerCase()) || xHandle.toLowerCase().includes("veenomous");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sourceType === "file" && !file) return;
    if (sourceType === "youtube" && !youtubeUrl.trim()) return;
    if (!title.trim()) return;

    setError("");
    setPhase("uploading");

    try {
      let audioUrl = "";
      let durationMins = 0;

      if (sourceType === "youtube") {
        // YouTube: pass URL directly to AssemblyAI (they accept YouTube URLs)
        audioUrl = youtubeUrl.trim();
        setPhase("transcribing");
      } else {
        // File upload: get duration, upload to Supabase Storage
        try {
          const audio = new Audio();
          audio.src = URL.createObjectURL(file!);
          await new Promise<void>((resolve) => {
            audio.addEventListener("loadedmetadata", () => {
              durationMins = Math.round(audio.duration / 60);
              resolve();
            });
            audio.addEventListener("error", () => resolve());
          });
        } catch {}

        const fileName = `${Date.now()}-${file!.name.replace(/[^a-z0-9.]/gi, "-")}`;
        const { error: uploadError } = await supabase.storage
          .from("spaces-audio")
          .upload(fileName, file!);

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from("spaces-audio")
          .getPublicUrl(fileName);

        audioUrl = urlData.publicUrl;
        setPhase("transcribing");
      }

      // Submit to API
      const res = await fetch("/api/spaces/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          opponent: opponent.trim() || null,
          date,
          audio_url: audioUrl,
          duration_mins: durationMins,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setSpaceId(data.id);

      // 4. Start polling
      let polls = 0;
      pollRef.current = setInterval(async () => {
        polls++;
        setPollCount(polls);
        if (polls > 120) {
          clearInterval(pollRef.current);
          setPhase("error");
          setError("Transcription is taking longer than expected. Check back at /spaces later.");
          return;
        }

        try {
          const statusRes = await fetch(`/api/spaces/status?id=${data.id}`);
          const statusData = await statusRes.json();

          if (statusData.status === "ready") {
            clearInterval(pollRef.current);
            setPhase("ready");
          } else if (statusData.status === "error") {
            clearInterval(pollRef.current);
            setPhase("error");
            setError(statusData.message || "Transcription failed");
          } else if (polls > 10) {
            setPhase("summarizing");
          }
        } catch {}
      }, 5000);
    } catch (err: any) {
      setPhase("error");
      setError(err.message || "Something went wrong");
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
          <div className="max-w-3xl mx-auto">
            <Link href="/spaces" className="text-white/40 hover:text-white text-sm font-body">&larr; Spaces</Link>
            <h1 className="font-display font-black text-2xl uppercase tracking-tight mt-4">Upload a Space</h1>
          </div>
        </div>
        <div className="h-1 bg-brand-red" />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-text-muted font-body">Sign in with X to upload.</p>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
          <div className="max-w-3xl mx-auto">
            <Link href="/spaces" className="text-white/40 hover:text-white text-sm font-body">&larr; Spaces</Link>
            <h1 className="font-display font-black text-2xl uppercase tracking-tight mt-4">Upload a Space</h1>
          </div>
        </div>
        <div className="h-1 bg-brand-red" />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-text-muted font-body">Upload access is restricted to trusted contributors.</p>
          <p className="text-text-muted/50 text-xs font-body mt-2">Signed in as: &quot;{xHandle}&quot;</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/spaces" className="text-white/40 hover:text-white text-sm font-body">&larr; Spaces</Link>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight mt-4">
            Upload a <span className="text-brand-red">Space</span>
          </h1>
          <p className="text-white/40 text-sm font-body mt-2">Upload a recorded X Space. AI will transcribe, summarize, and extract the hottest moments.</p>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        {phase === "form" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1.5 block">Title *</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Season Recap — End of 2025-26"
                className="w-full border border-black/10 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red/50" />
            </div>
            <div>
              <label className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1.5 block">Opponent / Topic</label>
              <input type="text" value={opponent} onChange={(e) => setOpponent(e.target.value)}
                placeholder="vs Toronto (season finale)"
                className="w-full border border-black/10 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red/50" />
            </div>
            <div>
              <label className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1.5 block">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full border border-black/10 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red/50" />
            </div>
            {/* Source type toggle */}
            <div>
              <label className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1.5 block">Source *</label>
              <div className="flex gap-1 mb-3">
                <button type="button" onClick={() => setSourceType("file")}
                  className={`px-4 py-2 font-display font-bold text-xs uppercase tracking-wider ${sourceType === "file" ? "bg-black text-white" : "bg-bg-surface text-text-muted"}`}>
                  Audio File
                </button>
                <button type="button" onClick={() => setSourceType("youtube")}
                  className={`px-4 py-2 font-display font-bold text-xs uppercase tracking-wider ${sourceType === "youtube" ? "bg-black text-white" : "bg-bg-surface text-text-muted"}`}>
                  YouTube URL
                </button>
              </div>
              {sourceType === "file" ? (
                <>
                  <input type="file" accept=".mp3,.m4a,.wav,.webm,.ogg"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full border border-black/10 px-4 py-3 font-body text-sm" />
                  <p className="text-text-muted text-[10px] font-body mt-1">MP3, M4A, WAV, or WebM. Max ~100MB.</p>
                </>
              ) : (
                <>
                  <input type="url" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full border border-black/10 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red/50" />
                  <p className="text-text-muted text-[10px] font-body mt-1">Paste a YouTube video URL. Works with podcasts, interviews, post-game shows.</p>
                </>
              )}
            </div>
            <button type="submit" disabled={
              !title.trim() || (sourceType === "file" && !file) || (sourceType === "youtube" && !youtubeUrl.trim())
            }
              className="bg-black text-white font-display font-bold text-xs uppercase tracking-wider px-8 py-3 hover:bg-brand-red transition-colors disabled:opacity-30">
              {sourceType === "youtube" ? "Transcribe Video" : "Upload & Transcribe"}
            </button>
          </form>
        )}

        {(phase === "uploading" || phase === "transcribing" || phase === "summarizing") && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-display font-black text-lg uppercase tracking-tight">
              {phase === "uploading" && "Uploading audio..."}
              {phase === "transcribing" && "Transcribing with AI..."}
              {phase === "summarizing" && "Generating summary & hot moments..."}
            </p>
            <p className="text-text-muted text-sm font-body mt-2">
              {phase === "transcribing" && `This takes a few minutes. Polling... (${pollCount})`}
              {phase === "summarizing" && "Almost done..."}
            </p>
          </div>
        )}

        {phase === "ready" && spaceId && (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-accent-green rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-white text-2xl">check</span>
            </div>
            <p className="font-display font-black text-xl uppercase tracking-tight mb-4">Space Ready!</p>
            <Link href={`/spaces/${spaceId}`}
              className="bg-brand-red text-white font-display font-bold text-sm uppercase tracking-wider px-8 py-3 hover:bg-brand-red/80 transition-colors inline-block">
              View Space
            </Link>
          </div>
        )}

        {phase === "error" && (
          <div className="text-center py-16">
            <p className="font-display font-black text-lg uppercase tracking-tight text-brand-red mb-2">Error</p>
            <p className="text-text-muted text-sm font-body mb-4">{error}</p>
            <button onClick={() => { setPhase("form"); setError(""); }}
              className="bg-black text-white font-display font-bold text-xs uppercase tracking-wider px-6 py-2">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
