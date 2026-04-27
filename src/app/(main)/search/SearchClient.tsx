"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, X, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";
import PostCard from "@/components/PostCard";
import type { PostWithAuthor } from "@/types/models";
import type { UserResult } from "./page";

const POST_TYPE_LABELS = {
  all: "전체",
  general: "일반글",
  report: "제보",
  temp_protect: "임보",
  adoption: "입양",
} as const;

type PostTypeKey = keyof typeof POST_TYPE_LABELS;
type Mode = "posts" | "neighborhood" | "users";

const MODES: { value: Mode; label: string }[] = [
  { value: "posts",        label: "게시물" },
  { value: "neighborhood", label: "동네"   },
  { value: "users",        label: "유저"   },
];

const PLACEHOLDER: Record<Mode, string> = {
  posts:        "게시물 내용 검색",
  neighborhood: "동 이름으로 검색 (예: 망원동)",
  users:        "아이디로 검색",
};

const EMPTY_HINT: Record<Mode, string> = {
  posts:        "검색어를 입력해보세요",
  neighborhood: "동 이름을 검색해보세요",
  users:        "아이디를 검색해보세요",
};

interface SearchClientProps {
  initialQ: string;
  initialType: PostTypeKey;
  initialMode: Mode;
  posts: PostWithAuthor[];
  users: UserResult[];
  isVerified: boolean;
  currentUserId: string | null;
  likedPostIds: string[];
}

export default function SearchClient({
  initialQ,
  initialType,
  initialMode,
  posts,
  users,
  isVerified,
  currentUserId,
  likedPostIds,
}: SearchClientProps) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);

  function navigate(overrides: Partial<{ q: string; type: PostTypeKey; mode: Mode }>) {
    const nextQ    = overrides.q    ?? q;
    const nextMode = overrides.mode ?? initialMode;
    const nextType = overrides.type ?? initialType;
    const params   = new URLSearchParams();
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

  const isEmpty =
    initialMode === "users"
      ? users.length === 0
      : posts.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-stone-900">검색</h1>
        <p className="text-xs text-stone-400 mt-0.5">게시물, 동네, 유저를 검색해보세요</p>
      </div>

      {/* 검색 입력 */}
      <form onSubmit={handleSubmit} className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={PLACEHOLDER[initialMode]}
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

      {/* 모드 탭 */}
      <div className="flex gap-2">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => navigate({ mode: value })}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors border",
              initialMode === value
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-stone-500 border-stone-200 hover:border-amber-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 게시물 타입 필터 */}
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

      {/* 결과 */}
      {!hasQuery ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Search size={40} className="mb-3 text-stone-300" />
          <p className="text-sm font-medium text-stone-500">{EMPTY_HINT[initialMode]}</p>
          {initialMode === "neighborhood" && (
            <p className="mt-1 text-xs text-stone-400">예: 망원동, 합정동, 연남동</p>
          )}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
            <PawPrint size={28} className="text-amber-300" />
          </div>
          <p className="text-sm font-semibold text-stone-500">검색 결과가 없어요</p>
          <p className="mt-1 text-xs text-stone-400">다른 검색어를 입력해보세요</p>
        </div>
      ) : initialMode === "users" ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-stone-400">{users.length}명의 결과</p>
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() =>
                router.push(u.id === currentUserId ? "/profile" : `/profile/${u.id}`)
              }
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-stone-100 text-left hover:bg-stone-50 transition-colors w-full"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-base shadow-sm">
                {u.username[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-900">@{u.username}</p>
              </div>
              {u.is_verified && (
                <span className="shrink-0 flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  ✓ 인증
                </span>
              )}
            </button>
          ))}
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
