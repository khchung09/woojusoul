import { createClient, createServiceClient } from "@/lib/supabase/server";
import { cacheLife } from "next/cache";
import Link from "next/link";
import type { PostWithAuthor } from "@/types/models";
import PostCard from "@/components/PostCard";

// 공개 posts 목록 — 30초 캐시 (사용자 무관 데이터)
async function getCachedPosts(): Promise<PostWithAuthor[] | null> {
  "use cache";
  cacheLife("seconds");
  const { data } = await createServiceClient()
    .from("posts")
    .select(`*, profiles(username, avatar_url, is_blinded)`)
    .order("created_at", { ascending: false })
    .limit(20);
  return data as PostWithAuthor[] | null;
}

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("is_verified, role").eq("id", user.id).single()
    : { data: null };

  const isVerified = profile?.is_verified ?? false;
  const isAdmin = profile?.role === "admin";

  const { data: likesData } = user
    ? await supabase.from("likes").select("post_id").eq("user_id", user.id)
    : { data: null };
  const likedPostIds = new Set(likesData?.map((l) => l.post_id) ?? []);

  // 서비스 롤로 RLS 우회 — requester_id 필터로 해당 유저 데이터만 조회
  const { data: locRequestsData } = user
    ? await createServiceClient()
        .from("location_requests")
        .select("post_id, status")
        .eq("requester_id", user.id)
    : { data: null };
  const locRequestMap = new Map<string, "pending" | "approved" | "rejected">(
    (locRequestsData ?? []).map((r) => [r.post_id, r.status as "pending" | "approved" | "rejected"])
  );

  const posts = await getCachedPosts();

  if (!posts || posts.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 0",
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
            fontSize: "32px",
          }}
        >
          🐾
        </div>
        <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
          아직 게시물이 없어요
        </p>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
          첫 번째 이야기를 들려주세요
        </p>
        <Link
          href="/write"
          style={{
            marginTop: "8px",
            borderRadius: "var(--r-pill)",
            background: "var(--accent)",
            color: "white",
            padding: "11px 24px",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          글 쓰기
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {/* 헤더 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(247,246,243,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2px" }}>
            피드
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            우주소울에서 이야기를 나눠요
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {isVerified && (
            <span
              style={{
                borderRadius: "var(--r-pill)",
                background: "var(--accent-bg)",
                color: "var(--accent)",
                padding: "4px 10px",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              ✓ 인증
            </span>
          )}
          <Link
            href="/write"
            style={{
              borderRadius: "var(--r-pill)",
              background: "var(--accent)",
              color: "white",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            글 쓰기
          </Link>
        </div>
      </div>

      {/* 게시물 목록 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="slide-up"
            style={{ animationDelay: `${index * 0.06}s` }}
          >
            <PostCard
              post={post}
              isVerified={isVerified}
              isAdmin={isAdmin}
              currentUserId={user?.id ?? null}
              initialLiked={likedPostIds.has(post.id)}
              initialLocationRequest={locRequestMap.get(post.id) ?? null}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
