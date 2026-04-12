"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { supabase, getVisitorId } from "@/lib/supabase";

interface ChatMessage {
  id: string;
  body: string;
  author: string;
  avatar: string | null;
  created_at: string;
  daps: number;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export default function KBArticleChat({
  articleSlug,
  articleTitle,
}: {
  articleSlug: string;
  articleTitle: string;
}) {
  const { data: session } = useSession();
  const xHandle = (session?.user as { xHandle?: string })?.xHandle;
  const xAvatar = session?.user?.image || null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dapped, setDapped] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(`kb-chat-daps-${articleSlug}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pageId = `kb-${articleSlug}`;

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("comments")
      .select("id, body, created_at, daps, user:users(x_handle, x_avatar)")
      .eq("page", pageId)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      setMessages(
        data.map((m: any) => ({
          id: m.id,
          body: m.body,
          author: m.user?.x_handle || "anonymous",
          avatar: m.user?.x_avatar || null,
          created_at: m.created_at,
          daps: m.daps || 0,
        }))
      );
    }
    setLoading(false);
  }, [pageId]);

  useEffect(() => {
    fetchMessages();
    // Poll every 15 seconds for new messages
    const interval = setInterval(fetchMessages, 15000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || submitting) return;
    if (!session) { signIn("twitter"); return; }

    setSubmitting(true);

    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("x_handle", xHandle)
      .single();

    if (userData) {
      await supabase.from("comments").insert({
        body: newMessage.trim(),
        page: pageId,
        user_id: userData.id,
        parent_id: null,
        visitor_id: getVisitorId(),
      });
    }

    setNewMessage("");
    setSubmitting(false);
    fetchMessages();
  }

  async function handleDap(id: string) {
    if (dapped.has(id)) return;
    const newDapped = new Set(dapped).add(id);
    setDapped(newDapped);
    try { localStorage.setItem(`kb-chat-daps-${articleSlug}`, JSON.stringify([...newDapped])); } catch {}

    setMessages(prev => prev.map(m => m.id === id ? { ...m, daps: m.daps + 1 } : m));
    await supabase.from("comments").update({ daps: messages.find(m => m.id === id)!.daps + 1 }).eq("id", id);
  }

  return (
    <div className="mt-8 pt-6 border-t border-black/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-[10px] uppercase tracking-[0.15em] text-text-muted flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-brand-red" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
          Discuss: {articleTitle}
        </h3>
        <span className="text-[9px] text-text-muted font-body">{messages.length} {messages.length === 1 ? "message" : "messages"}</span>
      </div>

      {/* Message input */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          {session?.user?.image ? (
            <img src={session.user.image} alt="" className="w-8 h-8 shrink-0 mt-1" />
          ) : (
            <div className="w-8 h-8 bg-black shrink-0 mt-1 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{(xHandle || "?")[0].toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={session ? "Share your take on this..." : "Sign in with X to discuss"}
              maxLength={280}
              className="w-full border border-black/10 px-3 py-2 text-sm font-body placeholder:text-text-muted/40 focus:outline-none focus:border-brand-red/30"
              disabled={!session}
              onClick={() => !session && signIn("twitter")}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || submitting || !session}
            className="bg-black text-white px-4 py-2 font-display font-bold text-[10px] uppercase tracking-wider disabled:opacity-20 hover:bg-brand-red transition-colors shrink-0"
          >
            {submitting ? "..." : "Post"}
          </button>
        </div>
      </form>

      {/* Messages */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-bg-surface animate-pulse-soft" />)}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-text-muted text-sm font-body">No discussion yet. Be the first to share your take.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-3 py-3 border-b border-black/5 last:border-0">
              {msg.avatar ? (
                <img src={msg.avatar} alt="" className="w-7 h-7 shrink-0 mt-0.5" />
              ) : (
                <div className="w-7 h-7 bg-black shrink-0 mt-0.5 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">{msg.author[0].toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xs text-text-primary">@{msg.author}</span>
                  <span className="text-text-muted text-[10px]">{timeAgo(msg.created_at)}</span>
                </div>
                <p className="text-text-secondary text-sm font-body mt-0.5 break-words">{msg.body}</p>
              </div>
              <button
                onClick={() => handleDap(msg.id)}
                disabled={dapped.has(msg.id)}
                className={`shrink-0 flex flex-col items-center gap-0.5 transition-colors ${
                  dapped.has(msg.id) ? "text-brand-red" : "text-text-muted/30 hover:text-brand-red cursor-pointer"
                }`}
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: dapped.has(msg.id) ? "'FILL' 1" : "" }}>favorite</span>
                {msg.daps > 0 && <span className="text-[9px] font-bold">{msg.daps}</span>}
              </button>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {!session && messages.length > 0 && (
        <button
          onClick={() => signIn("twitter")}
          className="w-full mt-3 border border-black/10 py-2.5 text-center text-sm font-body text-text-muted hover:text-brand-red hover:border-brand-red/30 transition-colors"
        >
          Sign in with X to join the discussion
        </button>
      )}
    </div>
  );
}
