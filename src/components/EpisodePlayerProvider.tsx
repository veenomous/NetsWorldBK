"use client";

import { createContext, useContext, useRef, ReactNode } from "react";

interface Ctx {
  seekTo: (seconds: number) => void;
  hasAudio: boolean;
}

const AudioCtx = createContext<Ctx>({ seekTo: () => {}, hasAudio: false });

export function useEpisodePlayer() {
  return useContext(AudioCtx);
}

export function EpisodePlayerProvider({
  audioUrl,
  children,
}: {
  audioUrl: string | null;
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const seekTo = (seconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, seconds);
    el.play().catch(() => {});
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <AudioCtx.Provider value={{ seekTo, hasAudio: !!audioUrl }}>
      {audioUrl && (
        <div className="sticky top-0 z-20 bg-bg-primary/95 backdrop-blur border-b border-black/10 py-3 -mx-4 sm:-mx-8 px-4 sm:px-8">
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            preload="metadata"
            className="w-full"
          />
        </div>
      )}
      {children}
    </AudioCtx.Provider>
  );
}
