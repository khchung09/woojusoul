"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart, MessageCircle, UserPlus, AtSign, ClipboardList, MapPin, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "@/lib/dateUtils";
import { markNotificationRead, markAllNotificationsRead, respondToLocationRequest } from "@/lib/actions";
import type { NotificationWithActor } from "@/types/models";

const POST_TYPE_LABEL: Record<string, string> = {
  general: "일반글",
  report: "제보",
  temp_protect: "임시보호",
  adoption: "입양",
};

const TYPE_ICON: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  like:              { icon: <Heart size={13} style={{ fill: "var(--danger)", color: "var(--danger)" }} />, color: "var(--danger)",  bg: "var(--danger-bg)"  },
  comment:           { icon: <MessageCircle size={13} />, color: "var(--warning)", bg: "var(--warning-bg)" },
  follow:            { icon: <UserPlus size={13} />,      color: "#3B82F6",        bg: "#EFF6FF"           },
  mention:           { icon: <AtSign size={13} />,        color: "var(--accent)",  bg: "var(--accent-bg)"  },
  application:       { icon: <ClipboardList size={13} />, color: "var(--gold)",    bg: "var(--gold-bg)"    },
  location_request:  { icon: <MapPin size={13} />,        color: "var(--accent)",  bg: "var(--accent-bg)"  },
  location_approved:    { icon: <MapPin size={13} />,        color: "var(--accent)",     bg: "var(--accent-bg)"  },
  location_rejected:    { icon: <MapPin size={13} />,        color: "var(--text-muted)", bg: "var(--surface-2)" },
  verification_approved: { icon: <CheckCircle size={13} />, color: "var(--accent)",     bg: "var(--accent-bg)"  },
  verification_request:  { icon: <CheckCircle size={13} />, color: "#3B82F6",           bg: "#EFF6FF"           },
};

const TYPE_TEXT: Record<string, string> = {
  like:              "좋아요를 눌렀어요",
  comment:           "댓글을 달았어요",
  follow:            "팔로우했어요",
  mention:           "회원님을 언급했어요",
  application:       "신청했어요",
  location_request:      "위치 열람을 신청했어요",
  location_approved:     "위치 열람을 승인했어요 📍",
  location_rejected:     "위치 열람 신청을 거절했어요",
  verification_approved: "신원 인증을 승인했어요 ✅",
  verification_request:  "인증을 신청했어요",
};

function ActorAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: "40px", height: "40px", borderRadius: "100px", objectFit: "cover", flexShrink: 0 }}
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

// location_request 전용 — <div> 기반이라 내부 버튼 중첩 가능
function LocationRequestItem({
  notification,
}: {
  notification: NotificationWithActor;
}) {
  const [responseStatus, setResponseStatus] = useState<"approved" | "rejected" | null>(null);
  const [responding, startRespondTransition] = useTransition();
  const name = notification.actor?.username ?? "알 수 없음";
  const isUnread = !notification.is_read;
  const typeConfig = TYPE_ICON.location_request;

  function handleRespond(action: "approved" | "rejected") {
    if (!notification.post_id || !notification.actor_id) return;
    startRespondTransition(async () => {
      const result = await respondToLocationRequest(
        notification.post_id!,
        notification.actor_id,
        action
      );
      if (!result.error) setResponseStatus(action);
    });
  }

  return (
    <div
      style={{
        width: "100%",
        borderRadius: "var(--r-lg)",
        background: isUnread ? "var(--accent-bg)" : "var(--surface)",
        border: `1.5px solid ${isUnread ? "var(--accent)" : "var(--border)"}`,
        borderLeft: isUnread ? "3px solid var(--accent)" : "1.5px solid var(--border)",
        padding: "14px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* 아바타 + 타입 뱃지 */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <ActorAvatar name={name} avatarUrl={notification.actor?.avatar_url} />
        <div
          style={{
            position: "absolute",
            bottom: "-2px",
            right: "-4px",
            width: "22px",
            height: "22px",
            borderRadius: "100px",
            background: typeConfig.bg,
            color: typeConfig.color,
            border: "2px solid var(--surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {typeConfig.icon}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "14px", color: "var(--text-primary)", margin: "0 0 3px", lineHeight: "1.4" }}>
          <span style={{ fontWeight: 700 }}>@{name}</span>
          {" "}
          <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
            위치 열람을 신청했어요
          </span>
        </p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 10px" }}>
          {formatDistanceToNow(notification.created_at)}
        </p>

        {/* 승인/거절 버튼 또는 처리 결과 */}
        {responseStatus === null ? (
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              type="button"
              onClick={() => handleRespond("approved")}
              disabled={responding}
              style={{
                borderRadius: "var(--r-pill)",
                background: "var(--accent)",
                border: "none",
                color: "white",
                padding: "5px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: responding ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: responding ? 0.6 : 1,
                transition: "transform 0.12s ease",
              }}
              onMouseDown={(e) => { if (!responding) (e.currentTarget as HTMLElement).style.transform = "scale(0.94)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              승인
            </button>
            <button
              type="button"
              onClick={() => handleRespond("rejected")}
              disabled={responding}
              style={{
                borderRadius: "var(--r-pill)",
                background: "var(--surface)",
                border: "1.5px solid var(--border)",
                color: "var(--text-secondary)",
                padding: "5px 14px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: responding ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                opacity: responding ? 0.6 : 1,
                transition: "transform 0.12s ease",
              }}
              onMouseDown={(e) => { if (!responding) (e.currentTarget as HTMLElement).style.transform = "scale(0.94)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              거절
            </button>
          </div>
        ) : (
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: responseStatus === "approved" ? "var(--accent)" : "var(--text-muted)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {responseStatus === "approved" ? (
              <><CheckCircle size={13} /> 승인됨</>
            ) : (
              "거절됨"
            )}
          </p>
        )}
      </div>

      {isUnread && (
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "100px",
            background: "var(--accent)",
            flexShrink: 0,
            marginTop: "6px",
          }}
        />
      )}
    </div>
  );
}

interface Props {
  notifications: NotificationWithActor[];
  unreadCount: number;
}

export default function NotificationList({ notifications, unreadCount }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function handleClick(notification: NotificationWithActor) {
    startTransition(async () => {
      if (!notification.is_read) await markNotificationRead(notification.id);
      if (notification.type === "follow") {
        router.push(`/profile/${notification.actor_id}`);
      } else if (notification.type === "verification_request") {
        router.push("/admin");
      } else if (notification.post_id) {
        router.push(`/posts/${notification.post_id}`);
      }
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  const actorName = (n: NotificationWithActor) => n.actor?.username ?? "알 수 없음";

  const contentPreview = (n: NotificationWithActor) => {
    const raw = n.post?.content ?? "";
    try {
      const parsed = JSON.parse(raw);
      if (parsed.description) return parsed.description as string;
    } catch {
      // plain text
    }
    return raw;
  };

  if (notifications.length === 0) {
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
          🔔
        </div>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>알림이 없어요</p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          좋아요나 댓글이 달리면 알려드릴게요
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {unreadCount > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "6px" }}>
          <button
            type="button"
            onClick={handleMarkAll}
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: "4px 0",
              transition: "transform 0.12s ease",
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.94)"; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          >
            모두 읽음
          </button>
        </div>
      )}

      {notifications.map((notification) => {
        // location_request는 승인/거절 버튼이 있어 별도 컴포넌트로 렌더링
        if (notification.type === "location_request") {
          return (
            <LocationRequestItem key={notification.id} notification={notification} />
          );
        }

        const name = actorName(notification);
        const preview = contentPreview(notification);
        const postTypeLabel = notification.post
          ? POST_TYPE_LABEL[notification.post.post_type] ?? ""
          : "";
        const typeConfig = TYPE_ICON[notification.type] ?? TYPE_ICON.comment;
        const isUnread = !notification.is_read;

        return (
          <button
            key={notification.id}
            type="button"
            onClick={() => handleClick(notification)}
            style={{
              width: "100%",
              borderRadius: "var(--r-lg)",
              background: isUnread ? "var(--accent-bg)" : "var(--surface)",
              border: `1.5px solid ${isUnread ? "var(--accent)" : "var(--border)"}`,
              borderLeft: isUnread ? "3px solid var(--accent)" : "1.5px solid var(--border)",
              padding: "14px 16px",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              transition: "transform 0.12s ease",
              boxShadow: "var(--shadow-sm)",
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          >
            {/* 아바타 + 타입 뱃지 */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <ActorAvatar name={name} avatarUrl={notification.actor?.avatar_url} />
              <div
                style={{
                  position: "absolute",
                  bottom: "-2px",
                  right: "-4px",
                  width: "22px",
                  height: "22px",
                  borderRadius: "100px",
                  background: typeConfig.bg,
                  color: typeConfig.color,
                  border: "2px solid var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {typeConfig.icon}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "14px", color: "var(--text-primary)", margin: "0 0 3px", lineHeight: "1.4" }}>
                <span style={{ fontWeight: 700 }}>@{name}</span>
                {" "}
                <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>
                  {TYPE_TEXT[notification.type] ?? "알림이 있어요"}
                </span>
              </p>

              {preview && (
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {postTypeLabel && (
                    <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>[{postTypeLabel}] </span>
                  )}
                  {preview}
                </p>
              )}

              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                {formatDistanceToNow(notification.created_at)}
              </p>
            </div>

            {isUnread && (
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "100px",
                  background: "var(--accent)",
                  flexShrink: 0,
                  marginTop: "6px",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
