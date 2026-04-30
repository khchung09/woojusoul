import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import BackButton from "./BackButton";
import CommentSection from "./CommentSection";
import ApplicationList from "./ApplicationList";
import type { PostWithAuthor, CommentWithAuthor, ApplicationWithApplicant } from "@/types/models";

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
      supabase.from("posts").select("*, profiles(username, avatar_url, is_blinded)").eq("id", id).single(),
      user
        ? supabase.from("profiles").select("is_verified, username, role").eq("id", user.id).single()
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
  const isOwner = user?.id === post.author_id;
  const isApplyable = post.post_type === "temp_protect" || post.post_type === "adoption";

  const { data: applicationsData } = isOwner && isApplyable
    ? await supabase
        .from("applications")
        .select("*, applicant:profiles!applicant_id(username, display_name, avatar_url)")
        .eq("post_id", id)
        .order("created_at", { ascending: false })
    : { data: null };

  const applications = (applicationsData ?? []) as ApplicationWithApplicant[];

  // 비로그인·본인 게시물·report 아닌 경우엔 불필요
  const { data: locRequestData } =
    user && post.post_type === "report" && user.id !== post.author_id
      ? await supabase
          .from("location_requests")
          .select("status")
          .eq("post_id", id)
          .eq("requester_id", user.id)
          .maybeSingle()
      : { data: null };
  const initialLocationRequest = (locRequestData?.status ?? null) as
    | "pending" | "approved" | "rejected" | null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
          gap: "12px",
        }}
      >
        <BackButton />
        <h1 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>게시물</h1>
      </div>

      <PostCard
        post={post}
        isVerified={profile?.is_verified ?? false}
        isAdmin={profile?.role === "admin"}
        currentUserId={user?.id ?? null}
        initialLiked={initialLiked}
        initialLocationRequest={initialLocationRequest}
        disableLink
      />

      <CommentSection
        postId={id}
        comments={comments}
        currentUserId={user?.id ?? null}
        currentUsername={profile?.username ?? null}
      />

      {isOwner && isApplyable && (
        <ApplicationList applications={applications} />
      )}
    </div>
  );
}
