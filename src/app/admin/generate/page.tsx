"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const ALLOWED_ADMINS = ["veenomous", "bkgrit"];

export default function GeneratePage() {
  const { data: session } = useSession();
  const xHandle = (session?.user as { xHandle?: string })?.xHandle || (session?.user?.name || "");
  const isAdmin = ALLOWED_ADMINS.some(h => h.toLowerCase() === xHandle.toLowerCase());

  const [input, setInput] = useState("");
  const [type, setType] = useState<"url" | "topic">("topic");
  const [generating, setGenerating] = useState(false);
  const [article, setArticle] = useState("");
  const [tweet, setTweet] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"article" | "tweet" | null>(null);

  async function handleGenerate() {
    if (!input.trim()) return;
    setGenerating(true);
    setError("");
    setArticle("");
    setTweet("");

    // Auto-detect type
    const isUrl = input.trim().startsWith("http");
    const detectedType = isUrl ? "url" : "topic";

    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), type: detectedType }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setArticle(data.article || "");
        setTweet(data.tweet || "");
      }
    } catch {
      setError("Failed to generate. Check your Anthropic API credits.");
    }
    setGenerating(false);
  }

  async function copyText(text: string, which: "article" | "tweet") {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted font-body">Access restricted.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="bg-black text-white px-4 sm:px-8 pt-4 pb-6">
        <div className="max-w-3xl mx-auto">
          <nav className="flex items-center gap-2 text-xs font-body mb-4">
            <Link href="/admin" className="text-white/40 hover:text-white transition-colors">&larr; Admin</Link>
          </nav>
          <h1 className="font-display font-black text-2xl uppercase tracking-tight">
            Generate <span className="text-brand-red">Article</span>
          </h1>
          <p className="text-white/40 text-sm font-body mt-1">Paste a URL or type a topic. AI writes it from the Nets perspective.</p>
        </div>
      </div>
      <div className="h-1 bg-brand-red" />

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        {/* Input */}
        <div className="mb-6">
          <label className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted mb-1.5 block">
            URL or Topic
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Paste an article URL or type a player name, trade idea, topic..."
            className="w-full border border-black/10 px-4 py-3 font-body text-sm focus:outline-none focus:border-brand-red/50"
          />
          <p className="text-text-muted text-[10px] font-body mt-1">
            Examples: "https://espn.com/..." or "Ja Morant trade scenarios" or "Cam Thomas career trajectory"
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!input.trim() || generating}
          className="bg-black text-white font-display font-bold text-xs uppercase tracking-wider px-8 py-3 hover:bg-brand-red transition-colors disabled:opacity-30 mb-8"
        >
          {generating ? "Generating..." : "Generate Article"}
        </button>

        {generating && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-muted text-sm font-body">Writing from the Nets perspective...</p>
          </div>
        )}

        {error && (
          <div className="border-l-4 border-l-brand-red border border-black/5 p-4 mb-6">
            <p className="text-brand-red text-sm font-body">{error}</p>
          </div>
        )}

        {/* Generated Tweet */}
        {tweet && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted">Tweet Draft</h3>
              <button onClick={() => copyText(tweet, "tweet")}
                className={`px-3 py-1 font-display font-bold text-[10px] uppercase tracking-wider ${
                  copied === "tweet" ? "bg-accent-green text-white" : "bg-black text-white hover:bg-brand-red"
                } transition-colors`}>
                {copied === "tweet" ? "Copied!" : "Copy Tweet"}
              </button>
            </div>
            <div className="border border-black/10 p-4">
              <p className="text-text-primary text-sm font-body">{tweet}</p>
            </div>
          </div>
        )}

        {/* Generated Article */}
        {article && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted">Generated Article</h3>
              <button onClick={() => copyText(article, "article")}
                className={`px-3 py-1 font-display font-bold text-[10px] uppercase tracking-wider ${
                  copied === "article" ? "bg-accent-green text-white" : "bg-black text-white hover:bg-brand-red"
                } transition-colors`}>
                {copied === "article" ? "Copied!" : "Copy Markdown"}
              </button>
            </div>
            <div className="border border-black/10 p-4 max-h-[600px] overflow-y-auto">
              <pre className="text-text-primary text-xs font-body whitespace-pre-wrap leading-relaxed">{article}</pre>
            </div>
            <p className="text-text-muted text-[10px] font-body mt-2">
              Copy the markdown and save it as a .md file in kb/wiki/[category]/ to publish. Or paste it to me and I&apos;ll add it to the wiki.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
