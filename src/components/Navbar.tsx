"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Search, User, Map, ShieldCheck, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { createClient } from "@/lib/supabase/client";

// 모바일 하단탭: 피드 / 검색 / 지도 / 알림 / 프로필 (FAB 빼고 5개)
const MOBILE_TABS = [
  { href: "/feed",    label: "피드",  icon: Home   },
  { href: "/search",  label: "검색",  icon: Search },
  { href: "/map",     label: "지도",  icon: Map    },
];

// 데스크탑 사이드바: 피드 / 검색 / [알림Bell] / 지도 / [글쓰기버튼] / 프로필
const DESKTOP_BEFORE_BELL = [
  { href: "/feed",   label: "피드",  icon: Home   },
  { href: "/search", label: "검색",  icon: Search },
];
const DESKTOP_AFTER_BELL = [
  { href: "/map",     label: "지도",    icon: Map  },
  { href: "/write",   label: "글쓰기",  icon: null },
  { href: "/profile", label: "프로필",  icon: User },
];

const mobileLink = (
  active: boolean
): React.CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "3px",
  padding: "6px 16px",
  textDecoration: "none",
  color: active ? "var(--accent)" : "var(--text-muted)",
  fontWeight: active ? 700 : 500,
  fontSize: "11px",
  transform: "scale(1)",
  transition: "all 0.15s ease",
});

const pressHandlers = {
  onMouseDown: (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.transform = "scale(0.92)";
  },
  onMouseUp: (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
  },
  onTouchStart: (e: React.TouchEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.transform = "scale(0.92)";
  },
  onTouchEnd: (e: React.TouchEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
  },
};

export function Navbar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* ── 모바일 하단 탭바 ── */}
      <nav
        className="md:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: "rgba(247,246,243,0.94)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            padding: "8px 8px 28px",
          }}
        >
          {/* 피드 / 검색 / 지도 */}
          {MOBILE_TABS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              style={mobileLink(isActive(href))}
              {...pressHandlers}
            >
              <Icon size={22} />
              <span>{label}</span>
            </Link>
          ))}

          {/* 알림 */}
          <NotificationBell />

          {/* 프로필 */}
          <Link
            href="/profile"
            style={mobileLink(isActive("/profile"))}
            {...pressHandlers}
          >
            <User size={22} />
            <span>프로필</span>
          </Link>
        </div>
      </nav>

      {/* ── 데스크탑 사이드바 ── */}
      <div className="hidden md:flex md:flex-col md:gap-1 md:flex-1">
        {/* 피드 / 검색 */}
        {DESKTOP_BEFORE_BELL.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
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
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              {Icon && <Icon size={20} />}
              {label}
            </Link>
          );
        })}

        {/* 알림 */}
        <NotificationBell desktop />

        {/* 지도 / 글쓰기 / 프로필 */}
        {DESKTOP_AFTER_BELL.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);

          if (href === "/write") {
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 16px",
                  borderRadius: "var(--r-md)",
                  background: "var(--accent)",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "14px",
                  textDecoration: "none",
                  margin: "4px 0",
                  transition: "all 0.15s ease",
                }}
                onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {label}
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
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
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              {Icon && <Icon size={20} />}
              {label}
            </Link>
          );
        })}

        {/* 관리자 메뉴 — admin만 표시 */}
        {isAdmin && (
          <>
            <div style={{ height: "1px", background: "var(--border)", margin: "8px 0" }} />
            <Link
              href="/admin"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 16px",
                borderRadius: "var(--r-md)",
                background: isActive("/admin") ? "#FEE2E2" : "transparent",
                color: isActive("/admin") ? "#DC2626" : "var(--text-secondary)",
                fontWeight: isActive("/admin") ? 700 : 500,
                fontSize: "14px",
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              <ShieldCheck size={20} />
              관리자
            </Link>
          </>
        )}

        {/* 로그아웃 — 하단 고정 */}
        <div style={{ marginTop: "auto", paddingTop: "8px" }}>
          <div style={{ height: "1px", background: "var(--border)", marginBottom: "8px" }} />
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 16px",
              borderRadius: "var(--r-md)",
              background: "transparent",
              color: "var(--text-muted)",
              fontWeight: 500,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s ease",
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          >
            <LogOut size={20} />
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}
