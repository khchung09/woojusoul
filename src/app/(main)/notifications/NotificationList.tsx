"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Heart, MessageCircle, Bell } from "lucide-react";
import { formatDistanceToNow } from "@/lib/dateUtils";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions";
import type { NotificationWithActor } from "@/types/models";

const POST_TYPE_LABEL: Record<string, string> = {
  general: "일반글",
  report: "제보",
  temp_protect: "임시보호",
  adoption: "입양",
};

function AuthorAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-sm shadow-sm">
      {name[0]}
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
      if (!notification.is_read) {
        await markNotificationRead(notification.id);
      }
      router.push(`/posts/${notification.post_id}`);
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  const actorName = (n: NotificationWithActor) =>
    n.actor?.display_name ?? n.actor?.username ?? "알 수 없음";

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
      <div className="flex flex-col items-center justify-center py-24 text-stone-400">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
          <Bell size={36} className="text-amber-300" />
        </div>
        <p className="text-base font-semibold text-stone-500">알림이 없어요</p>
        <p className="mt-1 text-sm text-stone-400">좋아요나 댓글이 달리면 알려드릴게요</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {unreadCount > 0 && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={handleMarkAll}
            className="text-xs text-stone-400 hover:text-amber-600 transition-colors"
          >
            모두 읽음
          </button>
        </div>
      )}

      {notifications.map((notification) => {
        const name = actorName(notification);
        const preview = contentPreview(notification);
        const postTypeLabel = notification.post
          ? POST_TYPE_LABEL[notification.post.post_type] ?? ""
          : "";

        return (
          <button
            key={notification.id}
            type="button"
            onClick={() => handleClick(notification)}
            className={`w-full rounded-2xl p-4 text-left transition-colors hover:bg-stone-100 ${
              notification.is_read ? "bg-white" : "bg-amber-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <AuthorAvatar name={name} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-stone-900">{name}</span>
                  {notification.type === "like" ? (
                    <>
                      <Heart size={13} className="text-red-500 fill-red-500 shrink-0" />
                      <span className="text-sm text-stone-600">좋아요를 눌렀어요</span>
                    </>
                  ) : (
                    <>
                      <MessageCircle size={13} className="text-amber-500 shrink-0" />
                      <span className="text-sm text-stone-600">댓글을 달았어요</span>
                    </>
                  )}
                </div>

                {preview && (
                  <p className="mt-0.5 text-xs text-stone-400 truncate">
                    {postTypeLabel && (
                      <span className="mr-1 font-medium text-stone-500">[{postTypeLabel}]</span>
                    )}
                    {preview}
                  </p>
                )}

                <p className="mt-1 text-xs text-stone-400">
                  {formatDistanceToNow(notification.created_at)}
                </p>
              </div>

              {!notification.is_read && (
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
