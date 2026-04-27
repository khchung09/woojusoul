import { createClient } from "@/lib/supabase/server";
import { PawPrint } from "lucide-react";
import Link from "next/link";
import type { PostWithAuthor } from "@/types/models";
import PostCard from "@/components/PostCard";

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("is_verified").eq("id", user.id).single()
    : { data: null };

  const isVerified = profile?.is_verified ?? false;

  const { data: likesData } = user
    ? await supabase.from("likes").select("post_id").eq("user_id", user.id)
    : { data: null };
  const likedPostIds = new Set(likesData?.map((l) => l.post_id) ?? []);

  const { data } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (
        username,
        avatar_url,
        is_blinded
      )
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  const posts = data as PostWithAuthor[] | null;

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-stone-400">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
          <PawPrint size={36} className="text-amber-300" />
        </div>
        <p className="text-base font-semibold text-stone-500">아직 게시물이 없어요</p>
        <p className="mt-1 text-sm text-stone-400">첫 번째 이야기를 들려주세요</p>
        <Link
          href="/write"
          className="mt-5 rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
        >
          글 쓰기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">피드</h1>
          <p className="text-xs text-stone-400 mt-0.5">우주소울에서 이야기를 나눠요</p>
        </div>
        <div className="flex items-center gap-2">
          {isVerified && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
              ✓ 인증
            </span>
          )}
          <Link
            href="/write"
            className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
          >
            글 쓰기
          </Link>
        </div>
      </div>

      {/* 게시물 목록 */}
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
  );
}
