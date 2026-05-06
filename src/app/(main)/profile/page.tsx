import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Profile, Pet, PostWithAuthor } from "@/types/models";
import ProfileEditor from "./ProfileEditor";
import ProfileTabs from "./ProfileTabs";
import VerificationSection from "./VerificationSection";
import PostCard from "@/components/PostCard";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as Profile | null;
  if (!profile) redirect("/login");

  const { data: petsData } = await supabase.from("pets").select("*").eq("owner_id", user.id);
  const pets = (petsData ?? []) as Pet[];

  const { data: postsData } = await supabase
    .from("posts")
    .select(`*, profiles(username, avatar_url, is_blinded)`)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const posts = (postsData ?? []) as PostWithAuthor[];

  const { data: likesData } = await supabase.from("likes").select("post_id").eq("user_id", user.id);
  const likedPostIds = new Set(likesData?.map((l) => l.post_id) ?? []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bookmarksRaw } = await (supabase.from("bookmarks" as any) as any)
    .select(`post_id, posts(*, profiles(username, avatar_url, is_blinded))`)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const bookmarksData = (bookmarksRaw ?? []) as { post_id: string; posts: PostWithAuthor | null }[];
  const bookmarkedPostIdSet = new Set(bookmarksData.map((b) => b.post_id));
  const bookmarkedPosts = bookmarksData
    .map((b) => b.posts)
    .filter((p): p is PostWithAuthor => p !== null);

  // post_id 단위로 현재 유저의 위치 열람 신청 상태 조회
  const { data: locRequestsData } = await supabase
    .from("location_requests")
    .select("post_id, status")
    .eq("requester_id", user.id);
  const locRequestMap = new Map<string, "pending" | "approved" | "rejected">(
    (locRequestsData ?? []).map((r) => [r.post_id, r.status as "pending" | "approved" | "rejected"])
  );

  const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user.id),
  ]);

  const petsContent =
    pets.length === 0 ? (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 0",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
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
          반려동물이 없어요
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          함께하는 친구를 등록해보세요
        </p>
      </div>
  ) : (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        {pets.map((pet) => (
          <div
            key={pet.id}
            style={{
              borderRadius: "var(--r-lg)",
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              padding: "16px",
              boxShadow: "var(--shadow-sm)",
            }}
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
                fontSize: "22px",
                marginBottom: "10px",
              }}
            >
              {pet.species === "dog" ? "🐶" : pet.species === "cat" ? "🐱" : "🐾"}
            </div>
            <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 3px" }}>{pet.name}</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{pet.breed ?? pet.species}</p>
            {pet.age && <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>{pet.age}살</p>}
          </div>
        ))}
      </div>
    );

  const postsContent =
    posts.length === 0 ? (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 0",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "100px",
            background: "var(--accent-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
          }}
        >
          📝
        </div>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
          아직 게시물이 없어요
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          첫 번째 이야기를 공유해보세요
        </p>
        <Link
          href="/write"
          style={{
            marginTop: "4px",
            borderRadius: "var(--r-pill)",
            background: "var(--accent)",
            color: "white",
            padding: "10px 22px",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          글 쓰기
        </Link>
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isVerified={profile.is_verified}
            isAdmin={profile.role === "admin"}
            currentUserId={user.id}
            initialLiked={likedPostIds.has(post.id)}
            initialBookmarked={bookmarkedPostIdSet.has(post.id)}
            initialLocationRequest={locRequestMap.get(post.id) ?? null}
          />
        ))}
      </div>
    );

  const bookmarksContent =
    bookmarkedPosts.length === 0 ? (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 0",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "100px",
            background: "var(--accent-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
          }}
        >
          🔖
        </div>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
          저장한 게시물이 없어요
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          마음에 드는 게시물을 북마크해보세요
        </p>
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {bookmarkedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isVerified={profile.is_verified}
            isAdmin={profile.role === "admin"}
            currentUserId={user.id}
            initialLiked={likedPostIds.has(post.id)}
            initialBookmarked={true}
            initialLocationRequest={locRequestMap.get(post.id) ?? null}
          />
        ))}
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <ProfileEditor
        profile={profile}
        userEmail={user.email ?? ""}
        postCount={posts.length}
        petCount={pets.length}
        followerCount={followerCount ?? 0}
        followingCount={followingCount ?? 0}
      />
      <VerificationSection
        isVerified={profile.is_verified}
        initialRealName={profile.real_name ?? null}
        initialPhone={profile.phone ?? null}
      />
      <ProfileTabs
        postsContent={postsContent}
        bookmarksContent={bookmarksContent}
        petsContent={petsContent}
      />
    </div>
  );
}
