"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WoojuSoulLogo } from "@/components/ui/Logo";
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
      options: {
        data: { username },
      },
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <WoojuSoulLogo size={56} />
          <h1 className="text-2xl font-bold text-stone-900">우주소울 가입하기</h1>
          <p className="text-sm text-stone-500">유기동물과 사람을 잇는 여정을 시작해요</p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
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
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
            회원가입
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-semibold text-amber-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
