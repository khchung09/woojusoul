import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";
import type { PostWithAuthor, Profile } from "@/types/models";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id === id) redirect("/profile");

  const [
    { data: profileData },
    { data: viewerProfile },
    { data: postsData },
    { data: likesData },
    { count: followerCount },
    { count: followingCount },
    { data: followData },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    user
      ? supabase.from("profiles").select("is_verified").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("posts")
      .select("*, profiles(username, avatar_url, is_blinded)")
      .eq("author_id", id)
      .order("created_at", { ascending: false }),
    user
      ? supabase.from("likes").select("post_id").eq("user_id", user.id)
      : Promise.resolve({ data: null }),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", id),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", id),
    user
      ? supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!profileData) notFound();

  const profile = profileData as Profile;
  const isVerified = viewerProfile?.is_verified ?? false;
  const posts = (postsData ?? []) as PostWithAuthor[];
  const likedPostIds = new Set(likesData?.map((l) => l.post_id) ?? []);
  const isFollowing = !!followData;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Link
          href="/feed"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 transition-colors"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-base font-bold text-stone-800">프로필</h1>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-stone-100">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-2xl shadow-sm">
            {profile.username[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-lg font-bold text-stone-900">@{profile.username}</p>
              {profile.is_verified && (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  ✓ 인증
                </span>
              )}
            </div>
          </div>
          {user && (
            <FollowButton targetUserId={id} initialIsFollowing={isFollowing} />
          )}
        </div>

        {profile.bio && (
          <p className="mt-4 text-sm text-stone-600 leading-relaxed">{profile.bio}</p>
        )}

        {/* 통계 */}
        <div className="mt-4 flex gap-6 border-t border-stone-100 pt-4">
          <div className="text-center">
            <p className="text-lg font-bold text-stone-900">{posts.length}</p>
            <p className="text-xs text-stone-400">게시물</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-stone-900">{followerCount ?? 0}</p>
            <p className="text-xs text-stone-400">팔로워</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-stone-900">{followingCount ?? 0}</p>
            <p className="text-xs text-stone-400">팔로잉</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 my-4 py-2">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-xs font-semibold text-stone-400 tracking-wide">
          게시물 {posts.length}개
        </span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      {posts.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl bg-white py-12 shadow-sm border border-stone-100">
          <p className="text-sm text-stone-400">아직 게시물이 없어요</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isVerified={isVerified}
              currentUserId={user?.id ?? null}
              initialLiked={likedPostIds.has(post.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
