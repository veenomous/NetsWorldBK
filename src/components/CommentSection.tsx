"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import { supabase, getVisitorId } from "@/lib/supabase";
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
        {textWithoutUrl && <p className="text-text-primary text-[15px] leading-relaxed break-words mb-2">{textWithoutUrl}</p>}
        <div className="rounded-xl overflow-hidden border border-gray-200 not-prose" data-theme="light">
          <Suspense fallback={<div className="h-20 bg-gray-50 animate-pulse-soft rounded-xl" />}>
            <Tweet id={tweetId} />
          </Suspense>
        </div>
      </div>
    );
  }
  return <p className="text-text-primary text-[15px] leading-relaxed break-words">{body}</p>;
}

interface Comment {
  id: string;
  body: string;
  created_at: string;
  parent_id: string | null;
  daps: number;
  user: { x_handle: string; x_name: string; x_avatar: string | null };
  replies?: Comment[];
  _parentHandle?: string;
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

// ─── Inline Reply Form ───
function InlineReplyForm({
  onSubmit,
  onCancel,
  replyingTo,
}: {
  onSubmit: (body: string) => Promise<void>;
  onCancel: () => void;
  replyingTo: string;
}) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    await onSubmit(body.trim());
    setBody("");
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 pl-4 border-l-2 border-brand-orange/30">
      <p className="text-text-muted text-xs mb-1.5">
        Replying to <span className="font-bold text-text-primary">@{replyingTo}</span>
      </p>
      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a reply..."
          maxLength={500}
          autoFocus
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-brand-orange/30 transition-colors"
        />
        <button type="submit" disabled={!body.trim() || submitting} className="px-3 py-2 rounded-lg gradient-bg-brand text-white text-xs font-bold disabled:opacity-40 hover:opacity-90 transition-opacity">
          {submitting ? "..." : "Reply"}
        </button>
        <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg bg-gray-100 text-text-muted text-xs font-bold hover:bg-gray-200 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Single Comment Row ───
function CommentRow({
  comment,
  onReply,
  onDelete,
  onEdit,
  onDap,
  userDaps,
  currentUserHandle,
  replyingToId,
  setReplyingToId,
  isNested = false,
}: {
  comment: Comment;
  onReply: (parentId: string, body: string) => Promise<void>;
  onDelete: (id: string) => void;
  onEdit: (id: string, body: string) => void;
  onDap: (id: string) => void;
  userDaps: Record<string, boolean>;
  currentUserHandle: string | null;
  replyingToId: string | null;
  setReplyingToId: (id: string | null) => void;
  isNested?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [collapsed, setCollapsed] = useState(false);
  const isOwner = currentUserHandle === comment.user.x_handle;
  const isReplying = replyingToId === comment.id;
  const replies = comment.replies || [];

  // Limit + show more
  const REPLY_LIMIT = 3;
  const [showAll, setShowAll] = useState(false);
  const visibleReplies = showAll ? replies : replies.slice(0, REPLY_LIMIT);
  const hiddenCount = replies.length - REPLY_LIMIT;

  if (collapsed) {
    return (
      <div className={`py-3 ${isNested ? "ml-6 border-l border-gray-100 pl-4" : "border-b border-gray-100"}`}>
        <button onClick={() => setCollapsed(false)} className="flex items-center gap-2 text-text-muted text-sm hover:text-text-secondary transition-colors">
          <span className="text-xs">+</span>
          <span className="font-bold">{comment.user.x_handle}</span>
          <span className="text-xs">{timeAgo(comment.created_at)}</span>
          <span className="text-xs">({replies.length} {replies.length === 1 ? "reply" : "replies"})</span>
        </button>
      </div>
    );
  }

  return (
    <div className={isNested ? "ml-6 border-l border-gray-100 pl-4" : "border-b border-gray-100 last:border-b-0"}>
      <div className="py-4">
        {/* Header: collapse toggle + username + time + avatar */}
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <button onClick={() => setCollapsed(true)} className="text-text-muted text-xs hover:text-text-secondary leading-none mt-0.5">—</button>
            <span className="text-[15px] font-black text-text-primary">{comment.user.x_handle}</span>
            <span className="text-text-muted text-xs">{timeAgo(comment.created_at)}</span>
          </div>
          {comment.user.x_avatar && (
            <img src={comment.user.x_avatar} alt="" className="w-7 h-7 rounded-full border border-gray-200" />
          )}
        </div>

        {/* "In reply to" label */}
        {comment._parentHandle && (
          <p className="text-text-muted text-xs mb-1.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v6M3 10l6-6M3 10l6 6" />
            </svg>
            In reply to <span className="font-bold text-text-primary">{comment._parentHandle}</span>
          </p>
        )}

        {/* Body */}
        {editing ? (
          <div className="mb-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[15px] text-text-primary resize-none focus:outline-none focus:border-brand-orange/30"
              rows={3}
              maxLength={500}
            />
            <div className="flex gap-2 mt-1.5">
              <button onClick={() => { onEdit(comment.id, editBody); setEditing(false); }} className="px-3 py-1.5 rounded-lg gradient-bg-brand text-white text-xs font-bold hover:opacity-90">Save</button>
              <button onClick={() => { setEditing(false); setEditBody(comment.body); }} className="px-3 py-1.5 rounded-lg bg-gray-100 text-text-muted text-xs font-bold hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="mb-3">
            <CommentBody body={comment.body} />
          </div>
        )}

        {/* Action bar */}
        {!editing && (
          <div className="flex items-center">
            <div className="flex items-center gap-4">
              {/* Dap */}
              <button
                onClick={() => !userDaps[comment.id] && onDap(comment.id)}
                className={`flex items-center gap-1 text-xs font-bold transition-colors ${
                  userDaps[comment.id] ? "text-brand-red" : "text-black/25 hover:text-brand-red"
                } ${userDaps[comment.id] ? "cursor-default" : "cursor-pointer"}`}
              >
                👊 Dap{comment.daps > 0 ? ` ${comment.daps}` : ""}
              </button>

              {/* Reply */}
              {currentUserHandle && (
                <button
                  onClick={() => setReplyingToId(isReplying ? null : comment.id)}
                  className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                    isReplying ? "text-brand-orange" : "text-text-muted hover:text-brand-orange"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v6M3 10l6-6M3 10l6 6" />
                  </svg>
                  Reply
                </button>
              )}

              {/* Share */}
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${comment.body.slice(0, 100)}${comment.body.length > 100 ? "..." : ""}" — @${comment.user.x_handle} on BK Grit`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-text-secondary transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share
              </a>
            </div>

            {/* Owner actions + Report (right side) */}
            <div className="ml-auto flex items-center gap-3">
              {isOwner && (
                <>
                  <button onClick={() => setEditing(true)} className="text-text-muted text-xs font-semibold hover:text-accent-blue transition-colors">Edit</button>
                  <button onClick={() => { if (confirm("Delete this comment?")) onDelete(comment.id); }} className="text-text-muted text-xs font-semibold hover:text-accent-red transition-colors">Delete</button>
                </>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Replies */}
      {visibleReplies.length > 0 && (
        <div>
          {visibleReplies.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
              onDap={onDap}
              userDaps={userDaps}
              currentUserHandle={currentUserHandle}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
              isNested
            />
          ))}
          {!showAll && hiddenCount > 0 && (
            <button onClick={() => setShowAll(true)} className="ml-6 pl-4 py-2 text-brand-orange text-xs font-semibold hover:underline">
              Show {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
            </button>
          )}
          {showAll && replies.length > REPLY_LIMIT && (
            <button onClick={() => setShowAll(false)} className="ml-6 pl-4 py-2 text-text-muted text-xs font-semibold hover:underline">
              Show less
            </button>
          )}
        </div>
      )}

      {/* Inline reply form — after all replies */}
      {isReplying && (
        <InlineReplyForm
          replyingTo={comment.user.x_handle}
          onSubmit={async (body) => {
            await onReply(comment.id, body);
            setReplyingToId(null);
          }}
          onCancel={() => setReplyingToId(null)}
        />
      )}
    </div>
  );
}

// ─── Main Component ───
export default function CommentSection({ page, compact = false }: { page: string; compact?: boolean }) {
  const { data: session } = useSession();
  const currentUserHandle = (session?.user as { xHandle?: string })?.xHandle || null;

  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [userDaps, setUserDaps] = useState<Record<string, boolean>>({});

  const fetchComments = useCallback(async () => {
    const visitorId = getVisitorId();

    const [commentsRes, dapsRes] = await Promise.all([
      supabase.from("comments").select("id, body, created_at, parent_id, daps, user:users(x_handle, x_name, x_avatar)").eq("page", page).order("created_at", { ascending: false }),
      supabase.from("comment_daps").select("comment_id").eq("visitor_id", visitorId),
    ]);

    if (dapsRes.data) {
      const dapMap: Record<string, boolean> = {};
      dapsRes.data.forEach((d: { comment_id: string }) => { dapMap[d.comment_id] = true; });
      setUserDaps(dapMap);
    }

    const data = commentsRes.data;

    if (!data) { setLoading(false); return; }

    const allComments = (data as unknown as Comment[]) || [];
    // Build handle lookup for "In reply to"
    const handleMap: Record<string, string> = {};
    for (const c of allComments) handleMap[c.id] = c.user.x_handle;

    const topLevel: Comment[] = [];
    const replyMap: Record<string, Comment[]> = {};

    for (const c of allComments) {
      if (c.parent_id) {
        c._parentHandle = handleMap[c.parent_id] || undefined;
        if (!replyMap[c.parent_id]) replyMap[c.parent_id] = [];
        replyMap[c.parent_id].push(c);
      } else {
        topLevel.push(c);
      }
    }

    function attachReplies(comment: Comment): Comment {
      const replies = (replyMap[comment.id] || []).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      comment.replies = replies.map(attachReplies);
      return comment;
    }

    setComments(topLevel.map(attachReplies));
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  async function getUserId(): Promise<string | null> {
    if (!session) return null;
    const xId = (session.user as { xId?: string }).xId;
    const { data } = await supabase.from("users").select("id").eq("x_id", xId).single();
    return data?.id || null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || !session) return;
    setSubmitting(true);
    const userId = await getUserId();
    if (!userId) { setSubmitting(false); return; }
    await supabase.from("comments").insert({ page, body: body.trim(), user_id: userId, parent_id: null });
    setBody("");
    setSubmitting(false);
    fetchComments();
  }

  async function handleReply(parentId: string, replyBody: string) {
    const userId = await getUserId();
    if (!userId) return;
    await supabase.from("comments").insert({ page, body: replyBody, user_id: userId, parent_id: parentId });
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

  async function handleDap(commentId: string) {
    if (userDaps[commentId]) return;
    const visitorId = getVisitorId();
    setUserDaps((prev) => ({ ...prev, [commentId]: true }));
    // Optimistic update
    setComments((prev) => {
      function updateDaps(list: Comment[]): Comment[] {
        return list.map((c) => ({
          ...c,
          daps: c.id === commentId ? (c.daps || 0) + 1 : c.daps,
          replies: c.replies ? updateDaps(c.replies) : undefined,
        }));
      }
      return updateDaps(prev);
    });
    await supabase.from("comment_daps").insert({ comment_id: commentId, visitor_id: visitorId });
    await supabase.from("comments").update({ daps: (comments.find(c => c.id === commentId)?.daps || 0) + 1 }).eq("id", commentId);
  }

  function countAll(list: Comment[]): number {
    return list.reduce((n, c) => n + 1 + countAll(c.replies || []), 0);
  }
  const totalComments = countAll(comments);

  return (
    <div className={compact ? "mt-3 pt-3 border-t border-gray-100" : "card p-5 sm:p-6"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={compact ? "text-xs font-bold text-text-muted uppercase tracking-wider" : "text-lg font-black text-text-primary"}>
          {compact ? "Replies" : "Discussion"}
        </h3>
        <span className="text-text-muted text-xs font-medium">
          {totalComments} {totalComments === 1 ? "comment" : "comments"}
        </span>
      </div>

      {/* Top-level form */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-5 pb-5 border-b border-gray-100">
          <div className="flex gap-3">
            {session.user?.image && (
              <img src={session.user.image} alt="" className="w-9 h-9 rounded-full border border-gray-200 shrink-0" />
            )}
            <div className="flex-1">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={compact ? "Write a reply..." : "What do you think?"}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted/50 resize-none focus:outline-none focus:border-brand-orange/30 transition-colors"
                rows={compact ? 1 : 2}
                maxLength={500}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!body.trim() || submitting}
                  className="px-5 py-2 bg-brand-red text-white text-xs font-black uppercase tracking-wider disabled:opacity-30 hover:bg-red-700 transition-all"
                >
                  {submitting ? "Posting..." : "Comment"}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : !compact ? (
        <button
          onClick={() => signIn("twitter")}
          className="w-full mb-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-brand-orange/5 hover:border-brand-orange/20 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-text-secondary text-sm font-semibold">Sign in with X to join the discussion</span>
        </button>
      ) : null}

      {/* Thread */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="py-4 border-b border-gray-100">
              <div className="h-4 w-32 rounded bg-gray-100 animate-pulse-soft mb-2" />
              <div className="h-5 w-full rounded bg-gray-50 animate-pulse-soft mb-1" />
              <div className="h-5 w-3/4 rounded bg-gray-50 animate-pulse-soft" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-text-muted text-sm text-center py-8">
          {compact ? "No replies yet." : "No comments yet. Start the conversation."}
        </p>
      ) : (
        <div>
          {comments.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onDap={handleDap}
              userDaps={userDaps}
              currentUserHandle={currentUserHandle}
              replyingToId={replyingToId}
              setReplyingToId={setReplyingToId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
