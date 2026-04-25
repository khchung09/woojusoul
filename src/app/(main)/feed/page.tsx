import { createClient } from "@/lib/supabase/server";
import { Heart, MessageCircle, PawPrint, MapPin } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/dateUtils";
import type { PostWithAuthor } from "@/types/models";

type PostType = "general" | "report" | "temp_protect" | "adoption";

const TYPE_BADGE: Record<PostType, { label: string; emoji: string; className: string } | null> = {
  general: null,
  report: {
    label: "제보",
    emoji: "🚨",
    className: "bg-red-100 text-red-600 border border-red-200",
  },
  temp_protect: {
    label: "임시보호구함",
    emoji: "🏠",
    className: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  adoption: {
    label: "입양보냄",
    emoji: "💛",
    className: "bg-green-100 text-green-700 border border-green-200",
  },
};

const ANIMAL_TYPE_LABEL: Record<string, string> = {
  cat: "🐱 고양이",
  dog: "🐶 강아지",
  other: "🐾 기타",
};

const ANIMAL_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  rescue_needed: { label: "구조필요", className: "bg-red-500 text-white" },
  protected: { label: "보호중", className: "bg-amber-500 text-white" },
  rescued: { label: "구조완료", className: "bg-green-500 text-white" },
};

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-400 text-white font-bold text-sm shadow-sm">
      {name[0]}
    </div>
  );
}

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("is_verified").eq("id", user.id).single()
    : { data: null };

  const isVerified = profile?.is_verified ?? false;

  const { data } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (
        username,
        display_name,
        avatar_url
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
      {posts.map((post) => {
        const postType = (post.post_type ?? "general") as PostType;
        const badge = TYPE_BADGE[postType];
        const authorName = post.profiles?.display_name ?? post.profiles?.username ?? "알 수 없음";
        const statusBadge = post.animal_status ? ANIMAL_STATUS_BADGE[post.animal_status] : null;
        const displayLocation =
          postType === "report"
            ? isVerified && post.location_address
              ? post.location_address
              : post.location
            : post.location;

        return (
          <article
            key={post.id}
            className="rounded-2xl bg-white shadow-sm border border-stone-100 overflow-hidden"
          >
            {/* 카드 상단 컬러 바 (제보/임시보호/입양) */}
            {postType === "report" && (
              <div className="h-1 bg-gradient-to-r from-red-400 to-rose-500" />
            )}
            {postType === "temp_protect" && (
              <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
            )}
            {postType === "adoption" && (
              <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
            )}

            <div className="p-5">
              {/* 작성자 + 배지 */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar name={authorName} />
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{authorName}</p>
                    <p className="text-xs text-stone-400">{formatDistanceToNow(post.created_at)}</p>
                  </div>
                </div>
                {badge && (
                  <span className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
                    <span>{badge.emoji}</span>
                    {badge.label}
                  </span>
                )}
              </div>

              {/* 제보 메타 정보 */}
              {postType === "report" && (post.animal_type || post.location || post.animal_status) && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {statusBadge && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge.className}`}>
                      {statusBadge.label}
                    </span>
                  )}
                  {post.animal_type && (
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">
                      {ANIMAL_TYPE_LABEL[post.animal_type] ?? post.animal_type}
                    </span>
                  )}
                  {displayLocation && (
                    <span className="flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-500">
                      <MapPin size={10} />
                      {displayLocation}
                    </span>
                  )}
                </div>
              )}

              {/* 본문 */}
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

              {/* 이미지 */}
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt="게시물 이미지"
                  className="mt-3 w-full rounded-xl object-cover max-h-72"
                />
              )}

              {/* 좋아요 / 댓글 */}
              <div className="mt-4 flex items-center gap-4 border-t border-stone-50 pt-3">
                <button className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-red-400 transition-colors">
                  <Heart size={16} />
                  <span>{post.likes_count}</span>
                </button>
                <button className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-500 transition-colors">
                  <MessageCircle size={16} />
                  <span>{post.comments_count}</span>
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
