import { createClient, createServiceClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import type { NotificationWithActor } from "@/types/models";
import NotificationList from "./NotificationList";

const getCachedNotifications = unstable_cache(
  async (userId: string): Promise<NotificationWithActor[]> => {
    const { data } = await createServiceClient()
      .from("notifications")
      .select(`
        *,
        actor:profiles!actor_id(username, avatar_url),
        post:posts(id, content, post_type)
      `)
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data as NotificationWithActor[]) ?? [];
  },
  ["notifications"],
  { revalidate: 10, tags: ["notifications"] }
);

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const notifications = await getCachedNotifications(user.id);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
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
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2px" }}>
            알림
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
            {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : "모든 알림을 읽었어요"}
          </p>
        </div>
      </div>

      <NotificationList notifications={notifications} unreadCount={unreadCount} />
    </div>
  );
}
