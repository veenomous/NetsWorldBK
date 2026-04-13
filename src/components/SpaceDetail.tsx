"use client";

import { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Utterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

interface HotMoment {
  quote: string;
  speaker: string;
  timestamp_ms: number;
  topic: string;
  fire_level: number;
}

interface Speaker {
  id: string;
  speaker_label: string;
  x_handle: string | null;
}

interface Space {
  id: string;
  title: string;
  opponent: string | null;
  date: string;
  duration_mins: number;
  audio_url: string;
  summary: string | null;
  status: string;
  transcript: Utterance[] | null;
  hot_moments: HotMoment[] | null;
  speaker_count: number;
}

function formatTs(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function FireLevel({ level }: { level: number }) {
  return (
    <span className="text-brand-red text-[10px]">
      {"🔥".repeat(Math.min(level, 5))}
    </span>
  );
}

export default function SpaceDetail({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise);
  const [space, setSpace] = useState<Space | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimHandle, setClaimHandle] = useState("");
  const [activeSegment, setActiveSegment] = useState(-1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    async function load() {
      const { data: spaceData } = await supabase
        .from("spaces")
        .select("*")
        .eq("id", id)
        .single();

      if (spaceData) setSpace(spaceData);

      const { data: speakerData } = await supabase
        .from("space_speakers")
        .select("*")
        .eq("space_id", id)
        .order("speaker_label");

      if (speakerData) setSpeakers(speakerData);
      setLoading(false);
    }
    load();
  }, [id]);

  // Track active segment based on audio time
  useEffect(() => {
    if (!audioRef.current || !space?.transcript) return;
    const audio = audioRef.current;
    const handleTimeUpdate = () => {
      const ms = audio.currentTime * 1000;
      const transcript = space.transcript || [];
      const idx = transcript.findIndex((u, i) => {
        const next = transcript[i + 1];
        return ms >= u.start && (!next || ms < next.start);
      });
      setActiveSegment(idx);
    };
    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [space]);

  function seekTo(ms: number) {
    if (audioRef.current) {
      audioRef.current.currentTime = ms / 1000;
      audioRef.current.play();
    }
  }

  function getSpeakerName(label: string): string {
    const claimed = speakers.find(s => s.speaker_label === label);
    return claimed?.x_handle ? `@${claimed.x_handle}` : label;
  }

  async function handleClaim(speakerId: string) {
    if (!claimHandle.trim()) return;
    await supabase
      .from("space_speakers")
      .update({ x_handle: claimHandle.trim(), claimed_at: new Date().toISOString() })
      .eq("id", speakerId);

    setSpeakers(prev => prev.map(s =>
      s.id === speakerId ? { ...s, x_handle: claimHandle.trim() } : s
    ));
    setClaimingId(null);
    setClaimHandle("");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="h-8 bg-white/10 animate-pulse-soft w-48 mb-4" />
            <div className="h-6 bg-white/10 animate-pulse-soft w-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted font-body">Space not found.</p>
      </div>
    );
  }

  const transcript = Array.isArray(space.transcript) ? space.transcript : [];
  const hotMoments = Array.isArray(space.hot_moments) ? space.hot_moments : [];

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
        <div className="max-w-4xl mx-auto">
          <nav className="flex items-center gap-2 text-xs font-body mb-4">
            <Link href="/spaces" className="text-white/40 hover:text-white transition-colors">&larr; Spaces</Link>
          </nav>
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
            {space.opponent && <span className="text-white/40 text-[10px] uppercase tracking-wider font-bold">{space.opponent}</span>}
            <span className="text-white/40 text-[10px]">{space.date}</span>
          </div>
          <h1 className="font-display font-black text-xl sm:text-3xl uppercase tracking-tight">{space.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-white/40 text-xs">
            <span>{space.duration_mins} min</span>
            <span>{space.speaker_count} speakers</span>
          </div>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        {/* Audio Player */}
        <div className="bg-black p-4 mb-8">
          <audio ref={audioRef} controls preload="metadata" src={space.audio_url} className="w-full" />
        </div>

        {/* Summary */}
        {space.summary && (
          <div className="mb-8">
            <h2 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>summarize</span>
              Summary
            </h2>
            <p className="text-text-secondary font-body text-sm leading-relaxed">{space.summary}</p>
          </div>
        )}

        {/* Hot Moments */}
        {hotMoments.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              Hot Moments
            </h2>
            <div className="space-y-2">
              {hotMoments.map((moment, i) => (
                <div key={i} className="border border-black/10 p-4 hover:border-brand-red/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <button onClick={() => seekTo(moment.timestamp_ms)}
                          className="text-brand-red text-xs font-bold hover:underline cursor-pointer">
                          {formatTs(moment.timestamp_ms)}
                        </button>
                        <span className="text-text-muted text-[10px] font-bold">{getSpeakerName(moment.speaker)}</span>
                        <FireLevel level={moment.fire_level} />
                      </div>
                      <p className="text-text-primary text-sm font-body">&ldquo;{moment.quote}&rdquo;</p>
                      <span className="tag tag-blue mt-2" style={{ fontSize: "8px", padding: "1px 6px" }}>{moment.topic}</span>
                    </div>
                    <button onClick={() => seekTo(moment.timestamp_ms)}
                      className="shrink-0 text-text-muted/30 hover:text-brand-red transition-colors">
                      <span className="material-symbols-outlined text-lg">play_circle</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Speakers */}
        {speakers.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              Speakers
            </h2>
            <div className="flex flex-wrap gap-2">
              {speakers.map((speaker) => (
                <div key={speaker.id} className="border border-black/10 px-3 py-2 flex items-center gap-2">
                  <span className="font-display font-bold text-xs uppercase">{speaker.speaker_label}</span>
                  {speaker.x_handle ? (
                    <span className="text-brand-red text-xs font-bold">@{speaker.x_handle}</span>
                  ) : claimingId === speaker.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={claimHandle}
                        onChange={(e) => setClaimHandle(e.target.value)}
                        placeholder="your X handle"
                        className="border border-black/10 px-2 py-1 text-xs w-28 focus:outline-none focus:border-brand-red/50"
                      />
                      <button onClick={() => handleClaim(speaker.id)} className="text-accent-green text-xs font-bold">Save</button>
                      <button onClick={() => setClaimingId(null)} className="text-text-muted text-xs">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setClaimingId(speaker.id)}
                      className="text-[10px] text-text-muted hover:text-brand-red font-bold uppercase tracking-wider transition-colors">
                      Claim
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
              Full Transcript
            </h2>
            <div className="border border-black/10 max-h-[500px] overflow-y-auto">
              {transcript.map((u, i) => (
                <div
                  key={i}
                  className={`flex gap-3 px-4 py-2 border-b border-black/5 last:border-0 cursor-pointer hover:bg-bg-surface transition-colors ${
                    activeSegment === i ? "bg-brand-red/5 border-l-2 border-l-brand-red" : ""
                  }`}
                  onClick={() => seekTo(u.start)}
                >
                  <button className="text-brand-red text-[10px] font-bold shrink-0 w-10 text-right hover:underline">
                    {formatTs(u.start)}
                  </button>
                  <span className="text-accent-blue text-[10px] font-bold shrink-0 w-20 uppercase">
                    {getSpeakerName(u.speaker)}
                  </span>
                  <p className="text-text-secondary text-sm font-body flex-1">{u.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Processing state */}
        {space.status === "processing" && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="font-display font-bold text-sm uppercase">Transcription in progress...</p>
            <p className="text-text-muted text-xs font-body mt-1">Audio is playable. Transcript will appear when ready.</p>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <Link href="/spaces" className="text-sm text-brand-red hover:underline font-body flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            All Spaces
          </Link>
          <Link href="/wire" className="text-sm text-text-muted hover:text-brand-red font-body flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-sm">forum</span>
            The Wire
          </Link>
        </div>
      </div>
    </div>
  );
}
