import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PostCard from "@/components/PostCard";
import CommentSection from "./CommentSection";
import type { PostWithAuthor, CommentWithAuthor } from "@/types/models";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: postData }, { data: profile }, { data: commentsData }, { data: likeData }] =
    await Promise.all([
      supabase
        .from("posts")
        .select("*, profiles(username, display_name, avatar_url)")
        .eq("id", id)
        .single(),
      user
        ? supabase.from("profiles").select("is_verified, display_name").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
      supabase
        .from("comments")
        .select("*, profiles(username, display_name, avatar_url)")
        .eq("post_id", id)
        .order("created_at", { ascending: true }),
      user
        ? supabase.from("likes").select("id").eq("post_id", id).eq("user_id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  if (!postData) notFound();

  const post = postData as PostWithAuthor;
  const comments = (commentsData ?? []) as CommentWithAuthor[];
  const initialLiked = !!likeData;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/feed"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 transition-colors"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-base font-bold text-stone-800">게시물</h1>
      </div>

      <PostCard
        post={post}
        isVerified={profile?.is_verified ?? false}
        currentUserId={user?.id ?? null}
        initialLiked={initialLiked}
        disableLink
      />

      <CommentSection
        postId={id}
        comments={comments}
        currentUserId={user?.id ?? null}
        currentUserDisplayName={profile?.display_name ?? null}
      />
    </div>
  );
}
