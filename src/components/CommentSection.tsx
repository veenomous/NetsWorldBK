"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import { supabase } from "@/lib/supabase";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  user: {
    x_handle: string;
    x_name: string;
    x_avatar: string | null;
  };
  replies?: Comment[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CommentBubble({
  comment,
  onReply,
  depth = 0,
}: {
  comment: Comment;
  onReply: (parentId: string) => void;
  depth?: number;
}) {
  return (
    <div className={depth > 0 ? "ml-6 sm:ml-10 border-l border-gray-200 pl-3 sm:pl-4" : ""}>
      <div className="flex gap-2.5 py-2.5">
        {comment.user.x_avatar ? (
          <img
            src={comment.user.x_avatar}
            alt={comment.user.x_handle}
            className="w-8 h-8 rounded-full border border-gray-200 shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-brand-orange/20 flex items-center justify-center text-brand-orange text-xs font-bold shrink-0">
            {comment.user.x_handle[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-text-primary">@{comment.user.x_handle}</span>
            <span className="text-text-muted text-[10px]">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed break-words">{comment.body}</p>
          {depth === 0 && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-text-muted text-[11px] font-semibold uppercase tracking-wider mt-1 hover:text-brand-orange transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentBubble key={reply.id} comment={reply} onReply={onReply} depth={1} />
      ))}
    </div>
  );
}

export default function CommentSection({ page }: { page: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from("comments")
      .select("id, body, created_at, parent_id, user:users(x_handle, x_name, x_avatar)")
      .eq("page", page)
      .order("created_at", { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }

    // Build thread tree
    const allComments = (data as unknown as Comment[]) || [];
    const topLevel: Comment[] = [];
    const replyMap: Record<string, Comment[]> = {};

    for (const c of allComments) {
      if (c.parent_id) {
        if (!replyMap[c.parent_id]) replyMap[c.parent_id] = [];
        replyMap[c.parent_id].push(c);
      } else {
        topLevel.push(c);
      }
    }

    for (const c of topLevel) {
      c.replies = (replyMap[c.id] || []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }

    setComments(topLevel);
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !session) return;

    setSubmitting(true);

    // Get user_id from Supabase by x_id
    const xId = (session.user as { xId?: string }).xId;
    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("x_id", xId)
      .single();

    if (!userData) {
      setSubmitting(false);
      return;
    }

    await supabase.from("comments").insert({
      page,
      body: body.trim(),
      user_id: userData.id,
      parent_id: replyTo,
    });

    setBody("");
    setReplyTo(null);
    setSubmitting(false);
    fetchComments();
  }

  const replyComment = replyTo ? comments.find((c) => c.id === replyTo) : null;

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="heading-md">Discussion</h3>
        <span className="text-text-muted text-xs">
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Comment form */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-4">
          {replyTo && replyComment && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-gray-100">
              <span className="text-text-muted text-xs">Replying to</span>
              <span className="text-brand-orange text-xs font-bold">@{replyComment.user.x_handle}</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-auto text-text-muted hover:text-accent-red text-xs"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={replyTo ? "Write a reply..." : "Drop a comment..."}
              className="flex-1 bg-bg-input border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 resize-none focus:outline-none focus:border-brand-orange/30 transition-colors"
              rows={2}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!body.trim() || submitting}
              className="self-end px-4 py-2.5 rounded-xl gradient-bg-brand text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {submitting ? "..." : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => signIn("twitter")}
          className="w-full mb-4 py-3 rounded-xl bg-gray-100 border border-gray-200 hover:bg-brand-orange/10 hover:border-brand-orange/20 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-text-secondary text-sm font-semibold">Sign in with X to comment</span>
        </button>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse-soft shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-gray-100 animate-pulse-soft" />
                <div className="h-4 w-full rounded bg-gray-100 animate-pulse-soft" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-6">No comments yet. Be the first.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map((comment) => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              onReply={(parentId) => setReplyTo(parentId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
