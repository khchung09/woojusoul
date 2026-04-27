import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { NotificationWithActor } from "@/types/models";
import NotificationList from "./NotificationList";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("notifications")
    .select(`
      *,
      actor:profiles!actor_id(username, display_name, avatar_url),
      post:posts(id, content, post_type)
    `)
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifications = (data as NotificationWithActor[]) ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">알림</h1>
          <p className="text-xs text-stone-400 mt-0.5">
            {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : "모든 알림을 읽었어요"}
          </p>
        </div>
      </div>

      <NotificationList notifications={notifications} unreadCount={unreadCount} />
    </div>
  );
}
