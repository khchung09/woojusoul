"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, Clock } from "lucide-react";
import { submitVerificationRequest } from "@/lib/actions";

interface Props {
  isVerified: boolean;
  initialRealName: string | null;
  initialPhone: string | null;
}

export default function VerificationSection({ isVerified, initialRealName, initialPhone }: Props) {
  const isPending = !isVerified && !!initialRealName && !!initialPhone;

  const [realName, setRealName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isRequesting, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!realName.trim() || !phone.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await submitVerificationRequest(realName, phone);
      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    });
  }

  // ── 인증 완료 ─────────────────────────────────────
  if (isVerified) {
    return (
      <div
        style={{
          borderRadius: "var(--r-lg)",
          background: "var(--accent-bg)",
          border: "1.5px solid var(--accent)",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <ShieldCheck size={20} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--accent)", margin: "0 0 1px" }}>
            인증된 유저 ✅
          </p>
          <p style={{ fontSize: "12px", color: "var(--accent-light)", margin: 0 }}>
            위치 열람 신청이 가능해요
          </p>
        </div>
      </div>
    );
  }

  // ── 심사 중 ──────────────────────────────────────
  if (isPending || submitted) {
    return (
      <div
        style={{
          borderRadius: "var(--r-lg)",
          background: "var(--warning-bg)",
          border: "1.5px solid var(--warning)",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Clock size={20} style={{ color: "var(--warning)", flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--warning)", margin: "0 0 1px" }}>
            인증 심사 중이에요 🕐
          </p>
          <p style={{ fontSize: "12px", color: "var(--warning)", opacity: 0.75, margin: 0 }}>
            관리자 검토 후 승인돼요
          </p>
        </div>
      </div>
    );
  }

  // ── 신청 폼 ──────────────────────────────────────
  return (
    <div
      style={{
        borderRadius: "var(--r-lg)",
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        padding: "18px 20px",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div style={{ marginBottom: "14px" }}>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 3px" }}>
          신원 인증 신청
        </p>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
          인증 후 위치 열람 신청이 가능해요
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
            실명
          </label>
          <input
            type="text"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="홍길동"
            maxLength={20}
            required
            style={{
              borderRadius: "var(--r-md)",
              border: "1.5px solid var(--border)",
              background: "var(--surface-2)",
              padding: "10px 14px",
              fontSize: "14px",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
            휴대폰번호
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            maxLength={20}
            required
            style={{
              borderRadius: "var(--r-md)",
              border: "1.5px solid var(--border)",
              background: "var(--surface-2)",
              padding: "10px 14px",
              fontSize: "14px",
              color: "var(--text-primary)",
              fontFamily: "inherit",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>

        {error && (
          <p style={{ fontSize: "13px", color: "var(--danger)", margin: 0 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={isRequesting || !realName.trim() || !phone.trim()}
          style={{
            borderRadius: "var(--r-pill)",
            background: "var(--accent)",
            border: "none",
            color: "white",
            padding: "11px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: isRequesting ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            opacity: isRequesting || !realName.trim() || !phone.trim() ? 0.6 : 1,
            transition: "transform 0.12s ease, opacity 0.12s ease",
          }}
          onMouseDown={(e) => { if (!isRequesting) (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
        >
          {isRequesting ? "신청 중..." : "인증 신청"}
        </button>
      </form>
    </div>
  );
}
