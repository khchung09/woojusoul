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
  Share2,
} from "lucide-react";
import { formatDistanceToNow } from "@/lib/dateUtils";
import { deletePost, toggleLike, requestLocationAccess } from "@/lib/actions";
import type { PostWithAuthor } from "@/types/models";
import ReportModal from "@/components/ReportModal";
import ApplicationModal from "@/components/ApplicationModal";
import { MentionText } from "@/components/MentionText";
import { MiniMap } from "@/components/MiniMap";
import Image from "next/image";

type PostType = "general" | "report" | "temp_protect" | "adoption";

const TYPE_CONFIG: Record<
  PostType,
  { label: string; emoji: string; color: string; bg: string } | null
> = {
  general: null,
  report: { label: "제보", emoji: "🚨", color: "var(--danger)", bg: "var(--danger-bg)" },
  temp_protect: { label: "임시보호", emoji: "🏠", color: "var(--warning)", bg: "var(--warning-bg)" },
  adoption: { label: "입양보냄", emoji: "💛", color: "var(--gold)", bg: "var(--gold-bg)" },
};

const ANIMAL_TYPE_LABEL: Record<string, string> = {
  cat: "🐱 고양이",
  dog: "🐶 강아지",
  other: "🐾 기타",
};

const ANIMAL_STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  rescue_needed: { label: "구조필요", color: "white", bg: "var(--danger)" },
  protected: { label: "보호중", color: "white", bg: "var(--warning)" },
  rescued: { label: "구조완료", color: "white", bg: "var(--accent-light)" },
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
const HEALTH_COLOR: Record<string, { color: string; bg: string }> = {
  good: { color: "var(--accent)", bg: "var(--accent-bg)" },
  treatment: { color: "var(--warning)", bg: "var(--warning-bg)" },
  warning: { color: "var(--danger)", bg: "var(--danger-bg)" },
};
const NEUTERED_LABEL: Record<string, string> = {
  yes: "중성화 완료",
  no: "중성화 미완료",
  unknown: "중성화 모름",
};

function parseImageUrls(imageUrl: string | null): string[] {
  if (!imageUrl) return [];
  if (imageUrl.startsWith("[")) {
    try { return JSON.parse(imageUrl) as string[]; } catch { return [imageUrl]; }
  }
  return [imageUrl];
}

function AuthorAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={40}
        height={40}
        style={{
          borderRadius: "100px",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "100px",
        background: "var(--accent-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        flexShrink: 0,
      }}
    >
      🐾
    </div>
  );
}

function AnimalInfoBlock({ content, type }: { content: string; type: "temp_protect" | "adoption" }) {
  let data: Record<string, string> | null = null;
  try {
    const parsed = JSON.parse(content);
    if (parsed._postFormat === type) data = parsed;
  } catch {
    // plain text fallback
  }

  if (!data) {
    return (
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
        {content}
      </p>
    );
  }

  const infoLine = [
    SPECIES_LABEL[data.species] ?? data.species,
    data.name ? `이름: ${data.name}` : null,
    data.age || null,
    GENDER_LABEL[data.gender] ?? data.gender,
  ].filter(Boolean).join(" · ");

  const healthStyle = data.health ? HEALTH_COLOR[data.health] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div
        style={{
          borderRadius: "var(--r-md)",
          background: "var(--surface-2)",
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{infoLine}</p>

        {type === "adoption" && data.neutered && (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            {NEUTERED_LABEL[data.neutered] ?? data.neutered}
          </p>
        )}

        {data.health && healthStyle && (
          <span
            style={{
              display: "inline-block",
              borderRadius: "var(--r-pill)",
              padding: "2px 10px",
              fontSize: "12px",
              fontWeight: 500,
              color: healthStyle.color,
              background: healthStyle.bg,
              alignSelf: "flex-start",
            }}
          >
            건강: {HEALTH_LABEL[data.health] ?? data.health}
          </span>
        )}

        {data.personality && (
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>성격: {data.personality}</p>
        )}

        {type === "temp_protect" && data.period && (
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
            임시보호 가능 기간: {data.period}
          </p>
        )}

        {type === "adoption" && data.conditions && (
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>입양 조건: {data.conditions}</p>
        )}
      </div>

      {data.description && (
        <MentionText
          text={data.description}
          style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}
        />
      )}
    </div>
  );
}

type LocationRequestStatus = "pending" | "approved" | "rejected";

type Props = {
  post: PostWithAuthor;
  isVerified?: boolean;
  isAdmin?: boolean;
  currentUserId?: string | null;
  initialLiked?: boolean;
  disableLink?: boolean;
  initialLocationRequest?: LocationRequestStatus | null;
};

export default function PostCard({
  post,
  isVerified = false,
  isAdmin = false,
  currentUserId,
  initialLiked = false,
  disableLink = false,
  initialLocationRequest = null,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [deleting, startDeleteTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [liking, startLikeTransition] = useTransition();
  const [locStatus, setLocStatus] = useState<LocationRequestStatus | null>(initialLocationRequest);
  const [locRequesting, startLocTransition] = useTransition();
  const [toast, setToast] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const skipNavRef = useRef(false);
  const router = useRouter();

  const postType = (post.post_type ?? "general") as PostType;
  const badge = (() => {
    const base = TYPE_CONFIG[postType];
    if (postType !== "report" || !base) return base;
    if (post.report_type === "abandoned") return { ...base, label: "유기동물", emoji: "🐾" };
    if (post.report_type === "abuse") return { ...base, label: "학대제보", emoji: "🚨" };
    return base;
  })();
  const authorName = post.profiles?.username ?? "알 수 없음";
  const statusBadge = post.animal_status ? ANIMAL_STATUS_BADGE[post.animal_status] : null;
  const imageUrls = parseImageUrls(post.image_url);
  const isOwn = !!currentUserId && currentUserId === post.author_id;
  console.log("isOwn:", isOwn, "currentUserId:", currentUserId, "author_id:", post.author_id);
  const isBlinded = ((post.report_count ?? 0) >= 5 || post.profiles?.is_blinded === true) && !isOwn;
  // 작성자·관리자·승인된 열람 요청자만 정확한 위치 표시
  const canSeeExactLocation = isAdmin || isOwn || locStatus === "approved";
  const displayLocation =
    postType === "report"
      ? canSeeExactLocation && post.location_address ? post.location_address : post.location
      : post.location;

  useEffect(() => {
    if (!menuOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        skipNavRef.current = true;
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  function handleCardClick() {
    if (disableLink) return;
    if (skipNavRef.current) { skipNavRef.current = false; return; }
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
    if (!currentUserId) { router.push("/login"); return; }
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
    startLikeTransition(async () => { await toggleLike(post.id); });
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const url = `${window.location.origin}/posts/${post.id}`;
    let plainText = post.content;
    try {
      const parsed = JSON.parse(post.content) as Record<string, string>;
      if (parsed.description) plainText = parsed.description;
    } catch { /* plain text */ }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `@${authorName}`, text: plainText.slice(0, 50), url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast("링크가 복사됐어요 🔗");
    } catch {
      showToast("링크 복사에 실패했어요");
    }
  }

  function handleLocationRequest(e: React.MouseEvent) {
    e.stopPropagation();
    if (!currentUserId) { router.push("/login"); return; }
    startLocTransition(async () => {
      const result = await requestLocationAccess(post.id, post.author_id);
      if (result.error) { showToast(result.error); return; }
      setLocStatus("pending");
    });
  }

  if (isBlinded) {
    return (
      <article
        style={{
          borderRadius: "var(--r-lg)",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <ShieldAlert size={20} style={{ flexShrink: 0, color: "var(--text-muted)" }} />
          <div>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-muted)", margin: "0 0 2px" }}>
              신고된 게시물입니다
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, opacity: 0.7 }}>
              커뮤니티 가이드라인 위반으로 가려졌어요
            </p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <>
      <article
        onClick={handleCardClick}
        style={{
          borderRadius: "var(--r-lg)",
          background: "var(--surface)",
          border: "1.5px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          overflow: "hidden",
          cursor: disableLink ? "default" : "pointer",
          transition: "box-shadow 0.15s ease, transform 0.12s ease",
        }}
        onMouseDown={(e) => {
          if (!disableLink) (e.currentTarget as HTMLElement).style.transform = "scale(0.97)";
        }}
        onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      >
        <div style={{ padding: "18px 20px" }}>
          {/* 헤더 */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "14px" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(isOwn ? "/profile" : `/profile/${post.author_id}`);
              }}
            >
              <AuthorAvatar name={authorName} avatarUrl={post.profiles?.avatar_url} />
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 1px" }}>
                  @{authorName}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                  {formatDistanceToNow(post.created_at)}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              {badge && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    borderRadius: "var(--r-pill)",
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: badge.color,
                    background: badge.bg,
                  }}
                >
                  <span>{badge.emoji}</span>
                  {badge.label}
                </span>
              )}

              {(isOwn || !!currentUserId) && (
                <div
                  ref={menuRef}
                  style={{ position: "relative" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                    style={{
                      width: "30px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "var(--r-sm)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                    }}
                    aria-label="게시물 옵션"
                  >
                    <MoreVertical size={15} />
                  </button>

                  {menuOpen && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "100%",
                        marginTop: "4px",
                        zIndex: 10,
                        width: "130px",
                        borderRadius: "var(--r-md)",
                        background: "var(--surface)",
                        border: "1.5px solid var(--border)",
                        boxShadow: "var(--shadow-md)",
                        padding: "6px",
                        overflow: "hidden",
                      }}
                    >
                      {isOwn ? (
                        <>
                          <button
                            onClick={handleEdit}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 10px",
                              fontSize: "13px",
                              color: "var(--text-primary)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              borderRadius: "var(--r-sm)",
                              textAlign: "left",
                            }}
                          >
                            <Pencil size={13} /> 수정하기
                          </button>
                          <button
                            onClick={handleDeleteConfirm}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 10px",
                              fontSize: "13px",
                              color: "var(--danger)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              borderRadius: "var(--r-sm)",
                              textAlign: "left",
                            }}
                          >
                            <Trash2 size={13} /> 삭제하기
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setShowReportModal(true); }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "8px 10px",
                            fontSize: "13px",
                            color: "var(--danger)",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            borderRadius: "var(--r-sm)",
                            textAlign: "left",
                          }}
                        >
                          <Flag size={13} /> 신고하기
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 제보 메타 */}
          {postType === "report" && (post.animal_type || post.location || post.animal_status) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
              {statusBadge && (
                <span
                  style={{
                    borderRadius: "var(--r-pill)",
                    padding: "3px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: statusBadge.color,
                    background: statusBadge.bg,
                  }}
                >
                  {statusBadge.label}
                </span>
              )}
              {post.animal_type && (
                <span
                  style={{
                    borderRadius: "var(--r-pill)",
                    padding: "3px 10px",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                    background: "var(--surface-2)",
                  }}
                >
                  {ANIMAL_TYPE_LABEL[post.animal_type] ?? post.animal_type}
                </span>
              )}
              {displayLocation && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    borderRadius: "var(--r-pill)",
                    padding: "3px 10px",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    background: "var(--surface-2)",
                  }}
                >
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
            <MentionText
              text={post.content}
              style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.65", whiteSpace: "pre-wrap" }}
            />
          )}

          {/* 이미지 */}
          {imageUrls.length === 1 && (
            <div style={{ marginTop: "14px", borderRadius: "var(--r-md)", overflow: "hidden" }}>
              <Image
                src={imageUrls[0]}
                alt="게시물 이미지"
                width={800}
                height={280}
                sizes="(max-width: 768px) 100vw, 600px"
                style={{ objectFit: "cover", width: "100%", height: "280px" }}
              />
            </div>
          )}
          {imageUrls.length >= 2 && (
            <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {imageUrls.slice(0, 4).map((url, i) => (
                <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                  <Image
                    src={url}
                    alt={`이미지 ${i + 1}`}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 50vw, 300px"
                  />
                  {i === 3 && imageUrls.length > 4 && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "var(--r-md)",
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 700,
                        fontSize: "20px",
                      }}
                    >
                      +{imageUrls.length - 4}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 미니 지도 — report 타입 + 위도/경도 있을 때만 */}
          {postType === "report" && post.latitude != null && post.longitude != null && (
            <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1.5px solid var(--surface-2)" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, margin: "0 0 6px" }}>
                📍 발견 위치
              </p>
              <MiniMap
                lat={post.latitude}
                lng={post.longitude}
                showExact={isAdmin || isOwn || locStatus === "approved"}
                postId={post.id}
              />
            </div>
          )}

          {/* 좋아요 / 댓글 */}
          <div
            style={{
              marginTop: "16px",
              paddingTop: "14px",
              borderTop: "1.5px solid var(--surface-2)",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <button
              type="button"
              onClick={handleLike}
              disabled={liking}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "13px",
                fontWeight: 500,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: liked ? "var(--danger)" : "var(--text-muted)",
                transition: "color 0.15s ease, transform 0.12s ease",
                padding: 0,
                fontFamily: "inherit",
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.9)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              <Heart
                size={16}
                style={{ fill: liked ? "var(--danger)" : "none", transition: "fill 0.15s ease" }}
              />
              <span>{likesCount}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!disableLink) router.push(`/posts/${post.id}`);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "13px",
                fontWeight: 500,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 0,
                fontFamily: "inherit",
              }}
            >
              <MessageCircle size={16} />
              <span>{post.comments_count}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "13px",
                fontWeight: 500,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                padding: 0,
                fontFamily: "inherit",
              }}
              aria-label="공유하기"
            >
              <Share2 size={16} />
            </button>

            {(postType === "temp_protect" || postType === "adoption") && !isOwn && currentUserId && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowApplyModal(true); }}
                style={{
                  marginLeft: "auto",
                  borderRadius: "var(--r-pill)",
                  background: "var(--accent-bg)",
                  border: "1.5px solid var(--accent)",
                  color: "var(--accent)",
                  padding: "5px 14px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "transform 0.12s ease",
                }}
                onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.95)"; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              >
                신청하기
              </button>
            )}

            {/* 위치 열람 신청 — report 타입, 본인 게시물 제외, 로그인 유저만 */}
            {postType === "report" && !isOwn && !!currentUserId && (
              <div style={{ marginLeft: "auto" }}>
                {locStatus === "approved" ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      borderRadius: "var(--r-pill)",
                      background: "var(--accent-bg)",
                      border: "1.5px solid var(--accent)",
                      color: "var(--accent)",
                      padding: "5px 14px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    승인됨 📍
                  </span>
                ) : locStatus === "pending" ? (
                  <button
                    type="button"
                    disabled
                    style={{
                      borderRadius: "var(--r-pill)",
                      background: "var(--surface-2)",
                      border: "1.5px solid var(--border)",
                      color: "var(--text-muted)",
                      padding: "5px 14px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "not-allowed",
                      fontFamily: "inherit",
                    }}
                  >
                    신청 완료
                  </button>
                ) : locStatus === "rejected" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>거절됨</span>
                    <button
                      type="button"
                      onClick={handleLocationRequest}
                      disabled={locRequesting}
                      style={{
                        borderRadius: "var(--r-pill)",
                        background: "var(--danger-bg)",
                        border: "1.5px solid var(--danger)",
                        color: "var(--danger)",
                        padding: "5px 14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: locRequesting ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                        opacity: locRequesting ? 0.6 : 1,
                        transition: "transform 0.12s ease",
                      }}
                      onMouseDown={(e) => { if (!locRequesting) (e.currentTarget as HTMLElement).style.transform = "scale(0.95)"; }}
                      onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                    >
                      재신청
                    </button>
                  </div>
                ) : !isVerified ? (
                  <button
                    type="button"
                    disabled
                    style={{
                      borderRadius: "var(--r-pill)",
                      background: "var(--surface-2)",
                      border: "1.5px solid var(--border)",
                      color: "var(--text-muted)",
                      padding: "5px 14px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "not-allowed",
                      fontFamily: "inherit",
                    }}
                  >
                    인증 후 신청 가능
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleLocationRequest}
                    disabled={locRequesting}
                    style={{
                      borderRadius: "var(--r-pill)",
                      background: "var(--accent-bg)",
                      border: "1.5px solid var(--accent)",
                      color: "var(--accent)",
                      padding: "5px 14px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: locRequesting ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      opacity: locRequesting ? 0.6 : 1,
                      transition: "transform 0.12s ease",
                    }}
                    onMouseDown={(e) => { if (!locRequesting) (e.currentTarget as HTMLElement).style.transform = "scale(0.95)"; }}
                    onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                  >
                    위치 열람 신청
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </article>

      {showReportModal && post.author_id && (
        <ReportModal postId={post.id} reportedUserId={post.author_id} onClose={() => setShowReportModal(false)} />
      )}

      {showApplyModal && (postType === "temp_protect" || postType === "adoption") && (
        <ApplicationModal postId={post.id} postType={postType} onClose={() => setShowApplyModal(false)} />
      )}

      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            padding: "16px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "360px",
              borderRadius: "var(--r-lg)",
              background: "var(--surface)",
              padding: "28px 24px",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
              게시물 삭제
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 24px" }}>
              삭제한 게시물은 복구할 수 없어요. 정말 삭제할까요?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                style={{
                  borderRadius: "var(--r-pill)",
                  border: "1.5px solid var(--border)",
                  background: "var(--surface)",
                  padding: "9px 18px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  borderRadius: "var(--r-pill)",
                  background: "var(--danger)",
                  border: "none",
                  padding: "9px 18px",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "white",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast toast-error">
          {toast}
        </div>
      )}
    </>
  );
}
