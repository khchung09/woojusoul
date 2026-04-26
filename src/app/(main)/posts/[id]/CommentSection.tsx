"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Send } from "lucide-react";
import { addComment, deleteComment } from "@/lib/actions";
import { formatDistanceToNow } from "@/lib/dateUtils";
import type { CommentWithAuthor } from "@/types/models";

type Props = {
  postId: string;
  comments: CommentWithAuthor[];
  currentUserId: string | null;
  currentUserDisplayName: string | null;
};

function CommentAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-xs shadow-sm">
      {name[0]}
    </div>
  );
}

export default function CommentSection({
  postId,
  comments: initialComments,
  currentUserId,
  currentUserDisplayName,
}: Props) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [input, setInput] = useState("");
  const [adding, startAddTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 서버 재검증 후 새 데이터를 반영
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !currentUserId) return;

    const text = input.trim();
    setInput("");

    // 낙관적 업데이트
    const tempId = `temp-${Date.now()}`;
    setComments((prev) => [
      ...prev,
      {
        id: tempId,
        post_id: postId,
        author_id: currentUserId,
        content: text,
        created_at: new Date().toISOString(),
        profiles: {
          username: currentUserDisplayName ?? "나",
          display_name: currentUserDisplayName,
          avatar_url: null,
        },
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
    <div className="rounded-2xl bg-white shadow-sm border border-stone-100">
      <div className="px-5 pt-4 pb-2 border-b border-stone-50">
        <p className="text-sm font-semibold text-stone-700">
          댓글 {comments.length}개
        </p>
      </div>

      {/* 댓글 목록 */}
      <div className="divide-y divide-stone-50">
        {comments.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-stone-400">
            첫 댓글을 남겨보세요 🐾
          </p>
        )}
        {comments.map((comment) => {
          const authorName =
            comment.profiles?.display_name ??
            comment.profiles?.username ??
            "알 수 없음";
          const isOwnComment =
            !!currentUserId && currentUserId === comment.author_id;
          const isTemp = comment.id.startsWith("temp-");

          return (
            <div
              key={comment.id}
              className={`flex gap-3 px-5 py-3.5 ${isTemp ? "opacity-60" : ""}`}
            >
              <CommentAvatar name={authorName} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-stone-800">
                      {authorName}
                    </span>
                    <span className="text-xs text-stone-400">
                      {formatDistanceToNow(comment.created_at)}
                    </span>
                  </div>
                  {isOwnComment && !isTemp && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      className="shrink-0 p-1 text-stone-300 hover:text-red-400 transition-colors disabled:opacity-40"
                      aria-label="댓글 삭제"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-stone-700 leading-relaxed whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 댓글 입력창 */}
      {currentUserId ? (
        <form
          onSubmit={handleAdd}
          className="flex items-end gap-2 border-t border-stone-100 px-4 py-3"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
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
            className="flex-1 resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-amber-300 disabled:opacity-50 leading-relaxed"
          />
          <button
            type="submit"
            disabled={!input.trim() || adding}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="댓글 등록"
          >
            <Send size={15} />
          </button>
        </form>
      ) : (
        <div className="border-t border-stone-100 px-5 py-4 text-center">
          <p className="text-sm text-stone-400">
            댓글을 작성하려면{" "}
            <a href="/login" className="text-amber-500 font-medium hover:underline">
              로그인
            </a>
            이 필요해요
          </p>
        </div>
      )}
    </div>
  );
}
