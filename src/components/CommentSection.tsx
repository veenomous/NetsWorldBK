"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import { supabase } from "@/lib/supabase";
import { Tweet } from "react-tweet";

function extractTweetId(text: string): string | null {
  const match = text.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

function CommentBody({ body }: { body: string }) {
  const tweetId = extractTweetId(body);
  if (tweetId) {
    const textWithoutUrl = body.replace(/https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status\/\d+\S*/g, "").trim();
    return (
      <div>
        {textWithoutUrl && <p className="text-text-secondary text-sm leading-relaxed break-words mb-2">{textWithoutUrl}</p>}
        <div className="rounded-xl overflow-hidden border border-gray-200 not-prose" data-theme="light">
          <Suspense fallback={<div className="h-20 bg-gray-50 animate-pulse-soft rounded-xl" />}>
            <Tweet id={tweetId} />
          </Suspense>
        </div>
      </div>
    );
  }
  return <p className="text-text-secondary text-sm leading-relaxed break-words">{body}</p>;
}

interface Comment {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  user: { x_handle: string; x_name: string; x_avatar: string | null };
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
  onDelete,
  onEdit,
  currentUserHandle,
  depth = 0,
}: {
  comment: Comment;
  onReply: (parentId: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, body: string) => void;
  currentUserHandle: string | null;
  depth?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const isOwner = currentUserHandle === comment.user.x_handle;

  return (
    <div className={depth > 0 ? "ml-6 sm:ml-10 border-l-2 border-gray-100 pl-3 sm:pl-4" : ""}>
      <div className="flex gap-2.5 py-2.5">
        {comment.user.x_avatar ? (
          <img src={comment.user.x_avatar} alt={comment.user.x_handle} className="w-8 h-8 rounded-full border border-gray-200 shrink-0" />
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

          {editing ? (
            <div className="mt-1">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full bg-bg-input border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary resize-none focus:outline-none focus:border-brand-orange/30"
                rows={2}
                maxLength={500}
              />
              <div className="flex gap-2 mt-1.5">
                <button
                  onClick={() => { onEdit(comment.id, editBody); setEditing(false); }}
                  className="text-[11px] font-semibold text-brand-orange hover:underline"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditBody(comment.body); }}
                  className="text-[11px] font-semibold text-text-muted hover:underline"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <CommentBody body={comment.body} />
          )}

          {!editing && (
            <div className="flex items-center gap-3 mt-1">
              {depth === 0 && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="text-text-muted text-[11px] font-semibold uppercase tracking-wider hover:text-brand-orange transition-colors"
                >
                  Reply
                </button>
              )}
              {isOwner && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-text-muted text-[11px] font-semibold uppercase tracking-wider hover:text-accent-blue transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="text-text-muted text-[11px] font-semibold uppercase tracking-wider hover:text-accent-red transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <CommentBubble
          key={reply.id}
          comment={reply}
          onReply={onReply}
          onDelete={onDelete}
          onEdit={onEdit}
          currentUserHandle={currentUserHandle}
          depth={1}
        />
      ))}
    </div>
  );
}

export default function CommentSection({ page, compact = false }: { page: string; compact?: boolean }) {
  const { data: session } = useSession();
  const currentUserHandle = (session?.user as { xHandle?: string })?.xHandle || null;

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

    if (!data) { setLoading(false); return; }

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

  useEffect(() => { fetchComments(); }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !session) return;
    setSubmitting(true);

    const xId = (session.user as { xId?: string }).xId;
    const { data: userData } = await supabase.from("users").select("id").eq("x_id", xId).single();
    if (!userData) { setSubmitting(false); return; }

    await supabase.from("comments").insert({
      page, body: body.trim(), user_id: userData.id, parent_id: replyTo,
    });

    setBody("");
    setReplyTo(null);
    setSubmitting(false);
    fetchComments();
  }

  async function handleDelete(id: string) {
    await supabase.from("comments").delete().eq("id", id);
    fetchComments();
  }

  async function handleEdit(id: string, newBody: string) {
    if (!newBody.trim()) return;
    await supabase.from("comments").update({ body: newBody.trim() }).eq("id", id);
    fetchComments();
  }

  const replyComment = replyTo ? comments.find((c) => c.id === replyTo) : null;
  const totalComments = comments.reduce((n, c) => n + 1 + (c.replies?.length || 0), 0);

  return (
    <div className={compact ? "mt-3 pt-3 border-t border-gray-100" : "card p-4 sm:p-5"}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={compact ? "text-xs font-bold text-text-muted uppercase tracking-wider" : "heading-md"}>
          {compact ? "Replies" : "Discussion"}
        </h3>
        <span className="text-text-muted text-xs">
          {totalComments} {compact ? "" : `comment${totalComments !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Comment form */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-3">
          {replyTo && replyComment && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-gray-50">
              <span className="text-text-muted text-xs">Replying to</span>
              <span className="text-brand-orange text-xs font-bold">@{replyComment.user.x_handle}</span>
              <button type="button" onClick={() => setReplyTo(null)} className="ml-auto text-text-muted hover:text-accent-red text-xs">
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={replyTo ? "Write a reply..." : compact ? "Reply..." : "Drop a comment..."}
              className="flex-1 bg-bg-input border border-gray-200 rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 resize-none focus:outline-none focus:border-brand-orange/30 transition-colors"
              rows={compact ? 1 : 2}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!body.trim() || submitting}
              className="self-end px-3 py-2 rounded-xl gradient-bg-brand text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {submitting ? "..." : "Post"}
            </button>
          </div>
        </form>
      ) : !compact ? (
        <button
          onClick={() => signIn("twitter")}
          className="w-full mb-3 py-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-brand-orange/10 hover:border-brand-orange/20 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-text-secondary text-sm font-semibold">Sign in with X to comment</span>
        </button>
      ) : null}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse-soft shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-gray-100 animate-pulse-soft" />
                <div className="h-4 w-full rounded bg-gray-50 animate-pulse-soft" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-text-muted text-xs text-center py-3">
          {compact ? "No replies yet." : "No comments yet. Be the first."}
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map((comment) => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              onReply={(parentId) => setReplyTo(parentId)}
              onDelete={handleDelete}
              onEdit={handleEdit}
              currentUserHandle={currentUserHandle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
