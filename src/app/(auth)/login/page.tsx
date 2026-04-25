"use client";

import { useState } from "react";
import Link from "next/link";
import { WoojuSoulLogo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <WoojuSoulLogo size={56} />
          <h1 className="text-2xl font-bold text-stone-900">우주소울에 오신 것을 환영해요</h1>
          <p className="text-sm text-stone-500">유기동물과 사람을 잇는 따뜻한 공간</p>
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
  );
}
