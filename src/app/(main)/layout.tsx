import { Navbar } from "@/components/Navbar";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  return (
    <div
      style={{ minHeight: "100vh", background: "var(--bg)" }}
      className="flex flex-col md:flex-row"
    >
      {/* 데스크탑 사이드바 */}
      <aside
        className="hidden md:flex md:flex-col"
        style={{
          width: "220px",
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "24px 16px",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 8px", marginBottom: "28px" }}>
          <Image
            src="/woojusoulicon.png"
            alt="우주소울"
            width={40}
            height={40}
            style={{ mixBlendMode: "multiply" }}
          />
          <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--accent)", whiteSpace: "nowrap" }}>
            우주소울
          </span>
        </div>
        <Navbar isAdmin={isAdmin} />
      </aside>

      {/* 메인 콘텐츠 */}
      <main style={{ flex: 1 }} className="pb-20 md:pb-0">
        <div
          style={{ maxWidth: "640px", margin: "0 auto", paddingLeft: "16px", paddingRight: "16px", paddingBottom: "24px" }}
          className="pt-[52px] md:pt-4"
        >
          {children}
        </div>
      </main>

      {/* 모바일 하단 네비게이션 */}
      <div className="md:hidden">
        <Navbar isAdmin={isAdmin} />
      </div>
    </div>
  );
}
