"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  desktop?: boolean;
}

export function NotificationBell({ desktop = false }: Props) {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channelRef: ReturnType<typeof supabase.channel> | null = null;

    async function fetchCount(userId: string) {
      if (cancelled) return;
      const { count: c } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", userId)
        .eq("is_read", false);
      if (!cancelled) setCount(c ?? 0);
    }

    async function setup() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      await fetchCount(user.id);
      if (cancelled) return;

      channelRef = supabase
        .channel(`notif-bell:${user.id}:${Math.random()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${user.id}`,
          },
          () => fetchCount(user.id)
        )
        .subscribe();
    }

    setup();
    return () => {
      cancelled = true;
      if (channelRef) supabase.removeChannel(channelRef);
    };
  }, []);

  useEffect(() => {
    if (pathname === "/notifications") setCount(0);
  }, [pathname]);

  const active = pathname.startsWith("/notifications");

  if (desktop) {
    return (
      <Link
        href="/notifications"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 16px",
          borderRadius: "var(--r-md)",
          background: active ? "var(--accent-bg)" : "transparent",
          color: active ? "var(--accent)" : "var(--text-secondary)",
          fontWeight: active ? 700 : 500,
          fontSize: "14px",
          textDecoration: "none",
          transition: "all 0.15s ease",
          position: "relative",
        }}
      >
        <span style={{ position: "relative" }}>
          <Bell size={20} />
          {count > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-6px",
                minWidth: "16px",
                height: "16px",
                borderRadius: "100px",
                background: "var(--danger)",
                color: "white",
                fontSize: "9px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 3px",
                lineHeight: 1,
              }}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </span>
        알림
      </Link>
    );
  }

  return (
    <Link
      href="/notifications"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "3px",
        padding: "6px 16px",
        textDecoration: "none",
        color: active ? "var(--accent)" : "var(--text-muted)",
        fontWeight: active ? 700 : 500,
        fontSize: "11px",
        transform: active ? "scale(1.05)" : "scale(1)",
        transition: "all 0.15s ease",
        position: "relative",
      }}
    >
      <span style={{ position: "relative" }}>
        <Bell size={22} />
        {count > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-6px",
              minWidth: "16px",
              height: "16px",
              borderRadius: "100px",
              background: "var(--danger)",
              color: "white",
              fontSize: "9px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              lineHeight: 1,
            }}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </span>
      <span>알림</span>
    </Link>
  );
}
