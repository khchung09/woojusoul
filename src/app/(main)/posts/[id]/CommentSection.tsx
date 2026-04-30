"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Send } from "lucide-react";
import { addComment, deleteComment } from "@/lib/actions";
import { formatDistanceToNow } from "@/lib/dateUtils";
import type { CommentWithAuthor } from "@/types/models";
import { MentionInput } from "@/components/MentionInput";
import { MentionText } from "@/components/MentionText";

type Props = {
  postId: string;
  comments: CommentWithAuthor[];
  currentUserId: string | null;
  currentUsername: string | null;
};

function CommentAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: "32px", height: "32px", borderRadius: "100px", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "100px",
        background: "var(--accent-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
        flexShrink: 0,
      }}
    >
      🐾
    </div>
  );
}

export default function CommentSection({
  postId,
  comments: initialComments,
  currentUserId,
  currentUsername,
}: Props) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [input, setInput] = useState("");
  const [adding, startAddTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !currentUserId) return;
    const text = input.trim();
    setInput("");

    const tempId = `temp-${Date.now()}`;
    setComments((prev) => [
      ...prev,
      {
        id: tempId,
        post_id: postId,
        author_id: currentUserId,
        content: text,
        created_at: new Date().toISOString(),
        profiles: { username: currentUsername ?? "나", avatar_url: null },
      },
    ]);

    startAddTransition(async () => {
      await addComment(postId, text);
      router.refresh();
    });
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    await deleteComment(commentId, postId);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div
      style={{
        borderRadius: "var(--r-lg)",
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      {/* 댓글 헤더 */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--surface-2)",
        }}
      >
        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          댓글 {comments.length}개
        </p>
      </div>

      {/* 댓글 목록 */}
      <div>
        {comments.length === 0 && (
          <p
            style={{
              padding: "28px 18px",
              textAlign: "center",
              fontSize: "14px",
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            첫 댓글을 남겨보세요 🐾
          </p>
        )}
        {comments.map((comment) => {
          const authorName = comment.profiles?.username ?? "알 수 없음";
          const isOwnComment = !!currentUserId && currentUserId === comment.author_id;
          const isTemp = comment.id.startsWith("temp-");

          return (
            <div
              key={comment.id}
              style={{
                display: "flex",
                gap: "10px",
                padding: "14px 18px",
                borderBottom: "1px solid var(--surface-2)",
                opacity: isTemp ? 0.6 : 1,
              }}
            >
              <CommentAvatar name={authorName} avatarUrl={comment.profiles?.avatar_url} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                      @{authorName}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {formatDistanceToNow(comment.created_at)}
                    </span>
                  </div>
                  {isOwnComment && !isTemp && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        opacity: deletingId === comment.id ? 0.4 : 1,
                        transition: "transform 0.12s ease",
                      }}
                      onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.88)"; }}
                      onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                      aria-label="댓글 삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <MentionText
                  text={comment.content}
                  style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.55", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 댓글 입력 */}
      {currentUserId ? (
        <form
          onSubmit={handleAdd}
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "8px",
            borderTop: "1.5px solid var(--border)",
            padding: "12px 16px",
          }}
        >
          <MentionInput
            value={input}
            onChange={setInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAdd(e as unknown as React.FormEvent);
              }
            }}
            placeholder="댓글을 입력하세요..."
            rows={1}
            maxLength={500}
            disabled={adding}
            wrapperClassName="flex-1 min-w-0"
            style={{
              width: "100%",
              resize: "none",
              borderRadius: "var(--r-pill)",
              border: "1.5px solid var(--border)",
              background: "var(--surface-2)",
              padding: "10px 16px",
              fontSize: "14px",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              outline: "none",
              lineHeight: "1.4",
            } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={!input.trim() || adding}
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "100px",
              background: "var(--accent)",
              border: "none",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              opacity: !input.trim() || adding ? 0.4 : 1,
              transition: "opacity 0.15s ease, transform 0.12s ease",
            }}
            onMouseDown={(e) => { if (input.trim() && !adding) (e.currentTarget as HTMLElement).style.transform = "scale(0.9)"; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            aria-label="댓글 등록"
          >
            <Send size={15} />
          </button>
        </form>
      ) : (
        <div
          style={{
            borderTop: "1.5px solid var(--border)",
            padding: "16px 18px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
            댓글을 작성하려면{" "}
            <a href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
              로그인
            </a>
            이 필요해요
          </p>
        </div>
      )}
    </div>
  );
}
