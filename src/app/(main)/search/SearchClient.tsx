"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useTransition, useRef } from "react";
import { Search, X, Map } from "lucide-react";
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
  { value: "posts", label: "게시물" },
  { value: "neighborhood", label: "동네" },
  { value: "users", label: "유저" },
];

const PLACEHOLDER: Record<Mode, string> = {
  posts: "게시물 내용 검색",
  neighborhood: "동 이름으로 검색 (예: 망원동)",
  users: "아이디로 검색",
};

const EMPTY_HINT: Record<Mode, string> = {
  posts: "게시물 내용을 검색해보세요",
  neighborhood: "동 이름을 검색해보세요",
  users: "아이디를 검색해보세요",
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
  locRequestRecord: Record<string, "pending" | "approved" | "rejected">;
}

export default function SearchClient({
  initialQ, initialType, initialMode, posts, users, isVerified, currentUserId, likedPostIds, locRequestRecord,
}: SearchClientProps) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [isPending, startTransition] = useTransition();

  // 서버 재렌더 시 입력창 동기화
  useEffect(() => { setQ(initialQ); }, [initialQ]);

  function navigate(overrides: Partial<{ q: string; type: PostTypeKey; mode: Mode }>) {
    const nextQ = overrides.q !== undefined ? overrides.q : q;
    const nextMode = overrides.mode ?? initialMode;
    const nextType = overrides.type ?? initialType;
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set("q", nextQ.trim());
    params.set("mode", nextMode);
    if (nextMode === "posts" && nextType !== "all") params.set("type", nextType);
    startTransition(() => { router.push(`/search?${params.toString()}`); });
  }

  // navigate 최신 참조 유지 (debounce useEffect에서 stale closure 방지)
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; });

  // 300ms debounce 자동검색
  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed === initialQ.trim()) return;
    const timer = setTimeout(() => { navigateRef.current({ q: trimmed }); }, 300);
    return () => clearTimeout(timer);
  }, [q, initialQ]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({ q });
  }

  const likedSet = new Set(likedPostIds);
  const hasQuery = initialQ.trim().length > 0;
  const isEmpty = initialMode === "users" ? users.length === 0 : posts.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* 헤더 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(247,246,243,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          paddingBottom: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2px" }}>검색</h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>게시물, 동네, 유저를 검색해보세요</p>
          </div>
          <Link
            href="/map"
            className="md:hidden"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "var(--r-pill)",
              background: "var(--accent-bg)",
              color: "var(--accent)",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              border: "1.5px solid var(--accent)",
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.94)"; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          >
            <Map size={14} />
            지도로 보기
          </Link>
        </div>

      {/* 검색 입력 */}
      <form onSubmit={handleSubmit} style={{ position: "relative" }}>
        <Search
          size={16}
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={PLACEHOLDER[initialMode]}
          style={{
            width: "100%",
            borderRadius: "var(--r-pill)",
            border: "1.5px solid var(--border)",
            background: "var(--surface)",
            padding: "11px 40px 11px 42px",
            fontSize: "14px",
            color: "var(--text-primary)",
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <X size={15} />
          </button>
        )}
      </form>

      {/* 모드 칩 */}
      <div style={{ display: "flex", gap: "8px" }}>
        {MODES.map(({ value, label }) => {
          const active = initialMode === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => navigate({ mode: value })}
              style={{
                borderRadius: "var(--r-pill)",
                border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                background: active ? "var(--accent)" : "var(--surface)",
                color: active ? "white" : "var(--text-secondary)",
                padding: "7px 16px",
                fontSize: "13px",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s ease",
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.94)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 게시물 타입 필터 칩 */}
      {initialMode === "posts" && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {(Object.keys(POST_TYPE_LABELS) as PostTypeKey[]).map((type) => {
            const active = initialType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => navigate({ type })}
                style={{
                  borderRadius: "var(--r-pill)",
                  border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                  background: active ? "var(--accent-bg)" : "var(--surface)",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s ease",
                }}
                onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.94)"; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              >
                {POST_TYPE_LABELS[type]}
              </button>
            );
          })}
        </div>
      )}

      </div>{/* /sticky header */}

      {/* 결과 영역 */}
      {isPending ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{ height: "120px", borderRadius: "var(--r-lg)", background: "var(--surface-2)" }}
            />
          ))}
        </div>
      ) : !hasQuery ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 0",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "100px",
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
            }}
          >
            🔍
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
            {EMPTY_HINT[initialMode]}
          </p>
          {initialMode === "neighborhood" && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>예: 망원동, 합정동, 연남동</p>
          )}
        </div>
      ) : isEmpty ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 0",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "100px",
              background: "var(--accent-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
            }}
          >
            🐾
          </div>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
            검색 결과가 없어요
          </p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>다른 검색어를 입력해보세요</p>
        </div>
      ) : initialMode === "users" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{users.length}명의 결과</p>
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => router.push(u.id === currentUserId ? "/profile" : `/profile/${u.id}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                borderRadius: "var(--r-lg)",
                background: "var(--surface)",
                border: "1.5px solid var(--border)",
                padding: "14px 16px",
                textAlign: "left",
                cursor: "pointer",
                width: "100%",
                boxShadow: "var(--shadow-sm)",
                transition: "transform 0.12s ease",
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "100px",
                  background: "var(--accent-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  flexShrink: 0,
                }}
              >
                🐾
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                  @{u.username}
                </p>
              </div>
              {u.is_verified && (
                <span
                  style={{
                    borderRadius: "var(--r-pill)",
                    background: "var(--accent-bg)",
                    color: "var(--accent)",
                    padding: "3px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  ✓ 인증
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{posts.length}개의 결과</p>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isVerified={isVerified}
              currentUserId={currentUserId}
              initialLiked={likedSet.has(post.id)}
              initialLocationRequest={locRequestRecord[post.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
