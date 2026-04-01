"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { setGuestName } from "@/lib/guest";

interface SignInPromptProps {
  onGuestSignIn: () => void;
  inline?: boolean;
}

export default function SignInPrompt({ onGuestSignIn, inline = false }: SignInPromptProps) {
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [name, setName] = useState("");

  function handleGuestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setGuestName(name.trim());
    onGuestSignIn();
  }

  if (inline) {
    // Compact version for inside cards/feeds
    return (
      <div className="space-y-2">
        {showGuestInput ? (
          <form onSubmit={handleGuestSubmit} className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pick a name..."
              maxLength={20}
              autoFocus
              className="flex-1 bg-gray-50 border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-red/30 transition-colors"
            />
            <button type="submit" disabled={!name.trim()} className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-wider disabled:opacity-30 hover:bg-gray-800 transition-all">
              Go
            </button>
            <button type="button" onClick={() => setShowGuestInput(false)} className="text-black/25 text-[10px] font-bold uppercase hover:text-black/50">
              Cancel
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowGuestInput(true)}
              className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-gray-800 transition-all"
            >
              Continue as Guest
            </button>
            <button
              onClick={() => signIn("twitter")}
              className="bg-brand-red text-white px-4 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-red-700 transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Sign in with X
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full block version
  return (
    <div className="w-full border border-gray-200 p-5 space-y-3">
      <p className="text-sm font-bold">Join the conversation</p>
      {showGuestInput ? (
        <form onSubmit={handleGuestSubmit} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pick a display name..."
            maxLength={20}
            autoFocus
            className="flex-1 bg-gray-50 border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-red/30 transition-colors"
          />
          <button type="submit" disabled={!name.trim()} className="bg-black text-white px-5 py-2.5 text-[11px] font-black uppercase tracking-wider disabled:opacity-30 hover:bg-gray-800 transition-all">
            Join
          </button>
        </form>
      ) : (
        <div className="space-y-2">
          <button
            onClick={() => setShowGuestInput(true)}
            className="w-full py-3 bg-black text-white font-black text-[11px] uppercase tracking-wider hover:bg-gray-800 transition-all"
          >
            Continue as Guest
          </button>
          <button
            onClick={() => signIn("twitter")}
            className="w-full py-3 bg-brand-red text-white font-black text-[11px] uppercase tracking-wider hover:bg-red-700 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Sign in with X
          </button>
        </div>
      )}
    </div>
  );
}
