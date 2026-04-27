"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function NotificationBell() {
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

      // Math.random()으로 채널 이름을 유일하게 만들어
      // 이전 채널이 완전히 정리되기 전 같은 이름으로 재구독할 때
      // 발생하는 "cannot add postgres_changes callbacks after subscribe()" 방지
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

  return (
    <Link
      href="/notifications"
      className={cn(
        "relative flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-colors md:flex-row md:gap-2 md:w-full md:px-4 md:text-sm",
        pathname.startsWith("/notifications")
          ? "text-amber-600 bg-amber-50"
          : "text-stone-500 hover:text-amber-600 hover:bg-amber-50"
      )}
    >
      <div className="relative">
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </div>
      <span>알림</span>
    </Link>
  );
}
