"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/feed");
      return;
    }

    setError("가입은 완료됐으나 자동 로그인에 실패했습니다. 로그인 페이지에서 직접 로그인해 주세요.");
    setLoading(false);
  }

  return (
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
            width={68}
            height={68}
            style={{ mixBlendMode: "multiply" }}
          />
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            우주소울 가입하기
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
            유기동물과 사람을 잇는 여정을 시작해요
          </p>
        </div>

        <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Input
            id="username"
            type="text"
            label="닉네임"
            placeholder="멍냥이집사"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
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
            placeholder="8자 이상 입력해 주세요"
            minLength={8}
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
            회원가입
          </Button>
        </form>

        <p style={{ marginTop: "24px", textAlign: "center", fontSize: "14px", color: "var(--text-muted)" }}>
          이미 계정이 있으신가요?{" "}
          <Link href="/login" style={{ fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}>
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
