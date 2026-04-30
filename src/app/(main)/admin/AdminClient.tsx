"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, MapPin, User, Clock } from "lucide-react";
import { approveVerification, rejectVerification, adminUpdateLocationRequest } from "@/lib/actions";
import { formatDistanceToNow } from "@/lib/dateUtils";

type PendingUser = {
  id: string;
  username: string;
  avatar_url: string | null;
  real_name: string;
  phone: string;
  created_at: string;
};

type LocationRequestRow = {
  id: string;
  post_id: string;
  requester_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  requester: { username: string } | null;
  post: { content: string; post_type: string } | null;
};

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  pending:  { text: "대기중",  color: "var(--warning)", bg: "var(--warning-bg)" },
  approved: { text: "승인됨",  color: "var(--accent)",  bg: "var(--accent-bg)"  },
  rejected: { text: "거절됨",  color: "var(--text-muted)", bg: "var(--surface-2)" },
};

const POST_TYPE_LABEL: Record<string, string> = {
  general: "일반글", report: "제보", temp_protect: "임시보호", adoption: "입양",
};

function UserAvatar({ username, avatarUrl }: { username: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username} style={{ width: "40px", height: "40px", borderRadius: "100px", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: "40px", height: "40px", borderRadius: "100px", background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
      🐾
    </div>
  );
}

// ── 인증 신청 탭 ──────────────────────────────────────
function VerificationTab({ users }: { users: PendingUser[] }) {
  const router = useRouter();
  const [results, setResults] = useState<Record<string, "approved" | "rejected">>({});
  const [pending, startTransition] = useTransition();

  function handle(userId: string, action: "approved" | "rejected") {
    startTransition(async () => {
      const result = action === "approved"
        ? await approveVerification(userId)
        : await rejectVerification(userId);
      if (!result.error) {
        setResults((prev) => ({ ...prev, [userId]: action }));
        router.refresh();
      }
    });
  }

  if (users.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "10px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "100px", background: "var(--accent-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>✅</div>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>처리 대기 중인 신청이 없어요</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{users.length}건 대기 중</p>
      {users.map((u) => {
        const result = results[u.id];
        return (
          <div
            key={u.id}
            style={{
              borderRadius: "var(--r-lg)",
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              padding: "16px",
              boxShadow: "var(--shadow-sm)",
              opacity: result ? 0.6 : 1,
              transition: "opacity 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <UserAvatar username={u.username} avatarUrl={u.avatar_url} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 1px" }}>@{u.username}</p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                  신청일: {formatDistanceToNow(u.created_at)}
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "14px" }}>
              {[
                { label: "실명", value: u.real_name, icon: <User size={12} /> },
                { label: "휴대폰", value: u.phone, icon: <User size={12} /> },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ borderRadius: "var(--r-sm)", background: "var(--surface-2)", padding: "8px 10px" }}>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "0 0 2px", display: "flex", alignItems: "center", gap: "4px" }}>
                    {icon} {label}
                  </p>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            {result ? (
              <p style={{ fontSize: "13px", fontWeight: 600, color: result === "approved" ? "var(--accent)" : "var(--text-muted)", margin: 0 }}>
                {result === "approved" ? "✅ 승인 완료" : "거절됨"}
              </p>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => handle(u.id, "approved")}
                  disabled={pending}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    borderRadius: "var(--r-pill)", background: "var(--accent)", border: "none",
                    color: "white", padding: "9px", fontSize: "13px", fontWeight: 600,
                    cursor: pending ? "not-allowed" : "pointer", fontFamily: "inherit",
                    opacity: pending ? 0.6 : 1, transition: "transform 0.12s ease",
                  }}
                  onMouseDown={(e) => { if (!pending) (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
                  onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                >
                  <Check size={14} /> 승인
                </button>
                <button
                  type="button"
                  onClick={() => handle(u.id, "rejected")}
                  disabled={pending}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    borderRadius: "var(--r-pill)", background: "var(--surface)", border: "1.5px solid var(--border)",
                    color: "var(--text-secondary)", padding: "9px", fontSize: "13px", fontWeight: 600,
                    cursor: pending ? "not-allowed" : "pointer", fontFamily: "inherit",
                    opacity: pending ? 0.6 : 1, transition: "transform 0.12s ease",
                  }}
                  onMouseDown={(e) => { if (!pending) (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
                  onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                >
                  <X size={14} /> 거절
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 위치 열람 현황 탭 ─────────────────────────────────
function LocationTab({ requests }: { requests: LocationRequestRow[] }) {
  const router = useRouter();
  const [overrides, setOverrides] = useState<Partial<Record<string, "approved" | "rejected">>>({});
  const [pending, startTransition] = useTransition();

  function handle(requestId: string, action: "approved" | "rejected") {
    startTransition(async () => {
      const result = await adminUpdateLocationRequest(requestId, action);
      if (!result.error) {
        setOverrides((prev) => ({ ...prev, [requestId]: action }));
        router.refresh();
      }
    });
  }

  if (requests.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "10px" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "100px", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>
          <MapPin size={28} style={{ color: "var(--text-muted)" }} />
        </div>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>위치 열람 신청이 없어요</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>총 {requests.length}건</p>
      {requests.map((req) => {
        const currentStatus = overrides[req.id] ?? req.status;
        const badge = STATUS_LABEL[currentStatus];
        const contentPreview = (() => {
          const raw = req.post?.content ?? "";
          try { const p = JSON.parse(raw); if (p.description) return p.description as string; } catch {}
          return raw;
        })();

        return (
          <div
            key={req.id}
            style={{
              borderRadius: "var(--r-lg)",
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              padding: "14px 16px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px" }}>
                  @{req.requester?.username ?? "알 수 없음"}
                </p>
                {req.post && (
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                    [{POST_TYPE_LABEL[req.post.post_type] ?? req.post.post_type}]{" "}
                    {contentPreview.slice(0, 40)}{contentPreview.length > 40 ? "…" : ""}
                  </p>
                )}
              </div>
              <span
                style={{
                  flexShrink: 0,
                  borderRadius: "var(--r-pill)",
                  padding: "3px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: badge.color,
                  background: badge.bg,
                }}
              >
                {badge.text}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                <Clock size={11} />
                {formatDistanceToNow(req.created_at)}
              </p>

              {/* 관리자 강제 처리 */}
              {currentStatus === "pending" && (
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => handle(req.id, "approved")}
                    disabled={pending}
                    style={{
                      borderRadius: "var(--r-pill)", background: "var(--accent-bg)",
                      border: "1.5px solid var(--accent)", color: "var(--accent)",
                      padding: "4px 12px", fontSize: "12px", fontWeight: 600,
                      cursor: pending ? "not-allowed" : "pointer", fontFamily: "inherit",
                      opacity: pending ? 0.6 : 1, transition: "transform 0.12s ease",
                    }}
                    onMouseDown={(e) => { if (!pending) (e.currentTarget as HTMLElement).style.transform = "scale(0.94)"; }}
                    onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    onClick={() => handle(req.id, "rejected")}
                    disabled={pending}
                    style={{
                      borderRadius: "var(--r-pill)", background: "var(--surface)",
                      border: "1.5px solid var(--border)", color: "var(--text-secondary)",
                      padding: "4px 12px", fontSize: "12px", fontWeight: 600,
                      cursor: pending ? "not-allowed" : "pointer", fontFamily: "inherit",
                      opacity: pending ? 0.6 : 1, transition: "transform 0.12s ease",
                    }}
                    onMouseDown={(e) => { if (!pending) (e.currentTarget as HTMLElement).style.transform = "scale(0.94)"; }}
                    onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                  >
                    거절
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── 메인 탭 컨테이너 ──────────────────────────────────
type Tab = "verification" | "location";

interface AdminClientProps {
  pendingUsers: PendingUser[];
  locationRequests: LocationRequestRow[];
}

export default function AdminClient({ pendingUsers, locationRequests }: AdminClientProps) {
  const [tab, setTab] = useState<Tab>("verification");

  const tabStyle = (t: Tab): React.CSSProperties => ({
    flex: 1,
    padding: "12px 0",
    fontSize: "14px",
    fontWeight: tab === t ? 700 : 500,
    color: tab === t ? "var(--accent)" : "var(--text-muted)",
    background: "none",
    border: "none",
    borderBottom: `2px solid ${tab === t ? "var(--accent)" : "transparent"}`,
    marginBottom: "-2px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "color 0.15s ease, border-color 0.15s ease",
  });

  return (
    <div>
      {/* 탭 헤더 */}
      <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: "16px" }}>
        <button type="button" style={tabStyle("verification")} onClick={() => setTab("verification")}>
          인증 신청 관리
          {pendingUsers.length > 0 && (
            <span style={{
              marginLeft: "6px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              height: "18px",
              borderRadius: "100px",
              background: "var(--danger)",
              color: "white",
              fontSize: "10px",
              fontWeight: 700,
              verticalAlign: "middle",
            }}>
              {pendingUsers.length}
            </span>
          )}
        </button>
        <button type="button" style={tabStyle("location")} onClick={() => setTab("location")}>
          위치 열람 현황
          {locationRequests.filter(r => r.status === "pending").length > 0 && (
            <span style={{
              marginLeft: "6px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              height: "18px",
              borderRadius: "100px",
              background: "var(--warning)",
              color: "white",
              fontSize: "10px",
              fontWeight: 700,
              verticalAlign: "middle",
            }}>
              {locationRequests.filter(r => r.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      <div key={tab} style={{ animation: "fadeIn 0.2s ease forwards" }}>
        {tab === "verification"
          ? <VerificationTab users={pendingUsers} />
          : <LocationTab requests={locationRequests} />
        }
      </div>
    </div>
  );
}
