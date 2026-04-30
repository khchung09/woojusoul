import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (myProfile?.role !== "admin") redirect("/feed");

  // 인증 대기 유저: real_name, phone 입력됐지만 is_verified = false
  const { data: pendingUsersRaw } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, real_name, phone, created_at")
    .eq("is_verified", false)
    .not("real_name", "is", null)
    .not("phone", "is", null)
    .order("created_at", { ascending: false });

  const pendingUsers = (pendingUsersRaw ?? []).map((u) => ({
    id: u.id,
    username: u.username,
    avatar_url: u.avatar_url,
    real_name: u.real_name as string,
    phone: u.phone as string,
    created_at: u.created_at,
  }));

  // 위치 열람 신청 전체 목록
  const { data: locRequestsRaw } = await supabase
    .from("location_requests")
    .select(`
      id,
      post_id,
      requester_id,
      status,
      created_at,
      requester:profiles!requester_id(username),
      post:posts!post_id(content, post_type)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  type RawLocReq = {
    id: string;
    post_id: string;
    requester_id: string;
    status: string;
    created_at: string;
    requester: { username: string } | null;
    post: { content: string; post_type: string } | null;
  };

  const locationRequests = ((locRequestsRaw ?? []) as RawLocReq[]).map((r) => ({
    id: r.id,
    post_id: r.post_id,
    requester_id: r.requester_id,
    status: r.status as "pending" | "approved" | "rejected",
    created_at: r.created_at,
    requester: r.requester,
    post: r.post,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 헤더 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(247,246,243,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          marginBottom: "4px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingBottom: "14px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "100px",
              background: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#DC2626",
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 1px" }}>
              관리자
            </h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
              인증 신청 {pendingUsers.length}건 대기 중
            </p>
          </div>
        </div>
      </div>

      <AdminClient
        pendingUsers={pendingUsers}
        locationRequests={locationRequests}
      />
    </div>
  );
}
