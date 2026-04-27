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
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
  }

  return (
    <>
    <OnboardingOverlay />
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Image src="/woojusoulicon.png" alt="우주소울" width={88} height={88} style={{ mixBlendMode: "multiply" }} />
          <h1 className="text-lg font-bold text-stone-900">우주소울에 오신 것을 환영해요</h1>
          <p className="text-sm text-stone-500">유기동물과 사람을 잇는 따뜻한 공간</p>
        </div>

        <button
          type="button"
          onClick={handleKakaoLogin}
          disabled={kakaoLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "#FEE500", color: "rgba(0,0,0,0.85)" }}
        >
          <KakaoIcon />
          {kakaoLoading ? "연결 중..." : "카카오 로그인"}
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-stone-200" />
          <span className="text-xs text-stone-400">또는</span>
          <div className="h-px flex-1 bg-stone-200" />
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
            로그인
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="font-semibold text-amber-600 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
    </>
  );
}
