"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, X, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";
import PostCard from "@/components/PostCard";
import type { PostWithAuthor } from "@/types/models";

const POST_TYPE_LABELS = {
  all: "전체",
  general: "일반글",
  report: "제보",
  temp_protect: "임보",
  adoption: "입양",
} as const;

type PostTypeKey = keyof typeof POST_TYPE_LABELS;
type Mode = "posts" | "neighborhood";

interface SearchClientProps {
  initialQ: string;
  initialType: PostTypeKey;
  initialMode: Mode;
  posts: PostWithAuthor[];
  isVerified: boolean;
  currentUserId: string | null;
  likedPostIds: string[];
}

export default function SearchClient({
  initialQ,
  initialType,
  initialMode,
  posts,
  isVerified,
  currentUserId,
  likedPostIds,
}: SearchClientProps) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);

  function navigate(overrides: Partial<{ q: string; type: PostTypeKey; mode: Mode }>) {
    const nextQ = overrides.q ?? q;
    const nextMode = overrides.mode ?? initialMode;
    const nextType = overrides.type ?? initialType;
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    params.set("mode", nextMode);
    if (nextMode === "posts" && nextType !== "all") params.set("type", nextType);
    router.push(`/search?${params.toString()}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ q });
  }

  const likedSet = new Set(likedPostIds);
  const hasQuery = initialQ.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-stone-900">검색</h1>
        <p className="text-xs text-stone-400 mt-0.5">게시물과 동네를 검색해보세요</p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            initialMode === "neighborhood"
              ? "동 이름으로 검색 (예: 망원동)"
              : "게시물 내용 검색"
          }
          className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-10 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
          >
            <X size={15} />
          </button>
        )}
      </form>

      <div className="flex gap-2">
        {(["posts", "neighborhood"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => navigate({ mode })}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors border",
              initialMode === mode
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-stone-500 border-stone-200 hover:border-amber-300"
            )}
          >
            {mode === "posts" ? "게시물" : "동네"}
          </button>
        ))}
      </div>

      {initialMode === "posts" && (
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(POST_TYPE_LABELS) as PostTypeKey[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => navigate({ type })}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                initialType === type
                  ? "bg-amber-50 border-amber-400 text-amber-700"
                  : "bg-white border-stone-200 text-stone-500 hover:border-amber-300"
              )}
            >
              {POST_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}

      {!hasQuery ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
          <Search size={40} className="mb-3 text-stone-300" />
          <p className="text-sm font-medium text-stone-500">
            {initialMode === "neighborhood"
              ? "동 이름을 검색해보세요"
              : "검색어를 입력해보세요"}
          </p>
          {initialMode === "neighborhood" && (
            <p className="mt-1 text-xs text-stone-400">예: 망원동, 합정동, 연남동</p>
          )}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <PawPrint size={28} className="text-amber-300" />
          </div>
          <p className="text-sm font-semibold text-stone-500">검색 결과가 없어요</p>
          <p className="mt-1 text-xs text-stone-400">다른 검색어를 입력해보세요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <p className="text-xs text-stone-400">{posts.length}개의 결과</p>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isVerified={isVerified}
              currentUserId={currentUserId}
              initialLiked={likedSet.has(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
