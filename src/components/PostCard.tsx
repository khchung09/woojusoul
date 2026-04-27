"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  Flag,
  ShieldAlert,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/dateUtils";
import { deletePost, toggleLike } from "@/lib/actions";
import type { PostWithAuthor } from "@/types/models";
import ReportModal from "@/components/ReportModal";
import ApplicationModal from "@/components/ApplicationModal";

type PostType = "general" | "report" | "temp_protect" | "adoption";

const TYPE_BADGE: Record<
  PostType,
  { label: string; emoji: string; className: string } | null
> = {
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

const SPECIES_LABEL: Record<string, string> = {
  dog: "🐶 강아지",
  cat: "🐱 고양이",
  other: "🐾 기타",
};
const GENDER_LABEL: Record<string, string> = {
  male: "수컷",
  female: "암컷",
  unknown: "모름",
};
const HEALTH_LABEL: Record<string, string> = {
  good: "양호",
  treatment: "치료중",
  warning: "요주의",
};
const HEALTH_COLOR: Record<string, string> = {
  good: "bg-green-100 text-green-700",
  treatment: "bg-amber-100 text-amber-700",
  warning: "bg-red-100 text-red-700",
};
const NEUTERED_LABEL: Record<string, string> = {
  yes: "중성화 완료",
  no: "중성화 미완료",
  unknown: "중성화 모름",
};

function parseImageUrls(imageUrl: string | null): string[] {
  if (!imageUrl) return [];
  if (imageUrl.startsWith("[")) {
    try {
      return JSON.parse(imageUrl) as string[];
    } catch {
      return [imageUrl];
    }
  }
  return [imageUrl];
}

function AuthorAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-sm shadow-sm">
      {name[0]}
    </div>
  );
}

function AnimalInfoBlock({
  content,
  type,
}: {
  content: string;
  type: "temp_protect" | "adoption";
}) {
  let data: Record<string, string> | null = null;
  try {
    const parsed = JSON.parse(content);
    if (parsed._postFormat === type) data = parsed;
  } catch {
    // plain text fallback
  }

  if (!data) {
    return (
      <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
        {content}
      </p>
    );
  }

  const infoLine = [
    SPECIES_LABEL[data.species] ?? data.species,
    data.name ? `이름: ${data.name}` : null,
    data.age || null,
    GENDER_LABEL[data.gender] ?? data.gender,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-xl bg-stone-50 border border-stone-100 p-3 space-y-1.5">
        <p className="text-sm font-semibold text-stone-800">{infoLine}</p>

        {type === "adoption" && data.neutered && (
          <p className="text-xs text-stone-500">
            {NEUTERED_LABEL[data.neutered] ?? data.neutered}
          </p>
        )}

        {data.health && (
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              HEALTH_COLOR[data.health] ?? "bg-stone-100 text-stone-600"
            }`}
          >
            건강: {HEALTH_LABEL[data.health] ?? data.health}
          </span>
        )}

        {data.personality && (
          <p className="text-xs text-stone-600">성격: {data.personality}</p>
        )}

        {type === "temp_protect" && data.period && (
          <p className="text-xs text-stone-600">
            임시보호 가능 기간: {data.period}
          </p>
        )}

        {type === "adoption" && data.conditions && (
          <p className="text-xs text-stone-600">입양 조건: {data.conditions}</p>
        )}
      </div>

      {data.description && (
        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
          {data.description}
        </p>
      )}
    </div>
  );
}

type Props = {
  post: PostWithAuthor;
  isVerified?: boolean;
  currentUserId?: string | null;
  initialLiked?: boolean;
  disableLink?: boolean;
};

export default function PostCard({
  post,
  isVerified = false,
  currentUserId,
  initialLiked = false,
  disableLink = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [deleting, startDeleteTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [liking, startLikeTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  // skipNavRef prevents navigation when user closes the dropdown menu by clicking elsewhere
  const skipNavRef = useRef(false);
  const router = useRouter();

  const postType = (post.post_type ?? "general") as PostType;
  const badge = TYPE_BADGE[postType];
  const authorName = post.profiles?.username ?? "알 수 없음";
  const statusBadge = post.animal_status
    ? ANIMAL_STATUS_BADGE[post.animal_status]
    : null;
  const displayLocation =
    postType === "report"
      ? isVerified && post.location_address
        ? post.location_address
        : post.location
      : post.location;

  const imageUrls = parseImageUrls(post.image_url);
  const isOwn = !!currentUserId && currentUserId === post.author_id;

  const isBlindedPost = (post.report_count ?? 0) >= 5 && !isOwn;
  const isBlindedUser = (post.profiles?.is_blinded === true) && !isOwn;
  const isBlinded = isBlindedPost || isBlindedUser;

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        // prevent the card click from navigating immediately after menu closes
        skipNavRef.current = true;
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  function handleCardClick() {
    if (disableLink) return;
    if (skipNavRef.current) {
      skipNavRef.current = false;
      return;
    }
    router.push(`/posts/${post.id}`);
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    router.push(`/write?edit=${post.id}`);
  }

  function handleDeleteConfirm(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      await deletePost(post.id, post.image_url);
      router.refresh();
    });
  }

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
    startLikeTransition(async () => {
      await toggleLike(post.id);
    });
  }

  if (isBlinded) {
    return (
      <article className="rounded-2xl bg-white shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-5 flex items-center gap-3">
          <ShieldAlert size={20} className="shrink-0 text-stone-300" />
          <div>
            <p className="text-sm font-medium text-stone-400">신고된 게시물입니다</p>
            <p className="text-xs text-stone-300 mt-0.5">커뮤니티 가이드라인 위반으로 가려졌어요</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <>
      <article
        onClick={handleCardClick}
        className={`rounded-2xl bg-white shadow-sm border border-stone-100 overflow-hidden ${
          !disableLink ? "cursor-pointer active:bg-stone-50 transition-colors" : ""
        }`}
      >
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
          {/* 헤더 */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                router.push(isOwn ? "/profile" : `/profile/${post.author_id}`);
              }}
            >
              <AuthorAvatar name={authorName} />
              <div>
                <p className="text-sm font-semibold text-stone-900 hover:underline">
                  @{authorName}
                </p>
                <p className="text-xs text-stone-400">
                  {formatDistanceToNow(post.created_at)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {badge && (
                <span
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
                >
                  <span>{badge.emoji}</span>
                  {badge.label}
                </span>
              )}

              {(isOwn || !!currentUserId) && (
                <div
                  className="relative"
                  ref={menuRef}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen((v) => !v);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 transition-colors"
                    aria-label="게시물 옵션"
                  >
                    <MoreVertical size={15} />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-2xl bg-white py-1.5 shadow-lg border border-stone-100">
                      {isOwn ? (
                        <>
                          <button
                            onClick={handleEdit}
                            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                          >
                            <Pencil size={13} />
                            수정하기
                          </button>
                          <button
                            onClick={handleDeleteConfirm}
                            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                            삭제하기
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(false);
                            setShowReportModal(true);
                          }}
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Flag size={13} />
                          신고하기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 제보 메타 정보 */}
          {postType === "report" &&
            (post.animal_type || post.location || post.animal_status) && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {statusBadge && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge.className}`}
                  >
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
          {postType === "temp_protect" || postType === "adoption" ? (
            <AnimalInfoBlock content={post.content} type={postType} />
          ) : (
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          {/* 이미지 */}
          {imageUrls.length === 1 && (
            <img
              src={imageUrls[0]}
              alt="게시물 이미지"
              className="mt-3 w-full rounded-xl object-cover max-h-72"
            />
          )}
          {imageUrls.length >= 2 && (
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {imageUrls.slice(0, 4).map((url, i) => (
                <div key={i} className="relative aspect-square">
                  <img
                    src={url}
                    alt={`이미지 ${i + 1}`}
                    className="h-full w-full rounded-xl object-cover"
                  />
                  {i === 3 && imageUrls.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 text-white font-bold text-xl">
                      +{imageUrls.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 좋아요 / 댓글 */}
          <div className="mt-4 flex items-center gap-4 border-t border-stone-50 pt-3">
            <button
              type="button"
              onClick={handleLike}
              disabled={liking}
              className={`flex items-center gap-1.5 text-sm transition-colors disabled:opacity-60 ${
                liked
                  ? "text-red-500 hover:text-red-400"
                  : "text-stone-400 hover:text-red-400"
              }`}
            >
              <Heart
                size={16}
                className={liked ? "fill-red-500" : ""}
              />
              <span>{likesCount}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!disableLink) router.push(`/posts/${post.id}`);
              }}
              className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-amber-500 transition-colors"
            >
              <MessageCircle size={16} />
              <span>{post.comments_count}</span>
            </button>

            {(postType === "temp_protect" || postType === "adoption") && !isOwn && currentUserId && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowApplyModal(true);
                }}
                className="ml-auto rounded-xl bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                신청하기
              </button>
            )}
          </div>
        </div>
      </article>

      {showReportModal && post.author_id && (
        <ReportModal
          postId={post.id}
          reportedUserId={post.author_id}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {showApplyModal && (postType === "temp_protect" || postType === "adoption") && (
        <ApplicationModal
          postId={post.id}
          postType={postType}
          onClose={() => setShowApplyModal(false)}
        />
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">게시물 삭제</h3>
            <p className="mt-2 text-sm text-stone-500">
              삭제한 게시물은 복구할 수 없어요. 정말 삭제할까요?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
