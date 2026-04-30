"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import OnboardingOverlay from "@/components/OnboardingOverlay";

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 1C4.578 1 1 3.867 1 7.4c0 2.24 1.432 4.204 3.584 5.336l-.912 3.392c-.08.296.256.536.512.368L8.128 13.92c.288.04.576.08.872.08 4.422 0 8-2.867 8-6.4S13.422 1 9 1z"
        fill="rgba(0,0,0,0.85)"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [kakaoLoading, setKakaoLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("이메일 또는 비밀번호를 확인해 주세요.");
      setLoading(false);
      return;
    }
    window.location.href = "/feed";
  }

  async function handleKakaoLogin() {
    setKakaoLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  }

  return (
    <>
      <OnboardingOverlay />
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          padding: "16px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
            borderRadius: "var(--r-lg)",
            background: "var(--surface)",
            padding: "40px 32px",
            boxShadow: "var(--shadow-md)",
            border: "1.5px solid var(--border)",
          }}
        >
          {/* 로고 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              marginBottom: "32px",
            }}
          >
            <Image
              src="/woojusoulicon.png"
              alt="우주소울"
              width={80}
              height={80}
              style={{ mixBlendMode: "multiply" }}
            />
            <h1 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              우주소울에 오신 것을 환영해요
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
              유기동물과 사람을 잇는 따뜻한 공간
            </p>
          </div>

          {/* 카카오 버튼 */}
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={kakaoLoading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              borderRadius: "var(--r-pill)",
              padding: "13px 24px",
              fontWeight: 700,
              fontSize: "15px",
              fontFamily: "inherit",
              backgroundColor: "#FEE500",
              color: "rgba(0,0,0,0.85)",
              border: "none",
              cursor: "pointer",
              opacity: kakaoLoading ? 0.6 : 1,
              transition: "transform 0.12s ease, opacity 0.12s ease",
            }}
            onMouseDown={(e) => { if (!kakaoLoading) (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          >
            <KakaoIcon />
            {kakaoLoading ? "연결 중..." : "카카오 로그인"}
          </button>

          {/* 구분선 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "20px 0",
            }}
          >
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>또는</span>
            <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          </div>

          {/* 이메일 로그인 폼 */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Input
              id="email"
              type="email"
              label="이메일"
              placeholder="hello@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              type="password"
              label="비밀번호"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--danger)",
                  background: "var(--danger-bg)",
                  padding: "10px 14px",
                  borderRadius: "var(--r-md)",
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}
            <Button type="submit" size="lg" loading={loading} style={{ width: "100%", marginTop: "4px" }}>
              로그인
            </Button>
          </form>

          <p style={{ marginTop: "24px", textAlign: "center", fontSize: "14px", color: "var(--text-muted)" }}>
            계정이 없으신가요?{" "}
            <Link href="/signup" style={{ fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
