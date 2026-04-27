"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Slide = {
  emoji?: string;
  logo?: true;
  title: string;
  subtitle: string;
  description?: string;
  bg: string;
  accentColor: string;
};

const SLIDES: Slide[] = [
  {
    logo: true,
    title: "우주소울",
    subtitle: "우리 주변의 모든 생명을 지켜요",
    bg: "bg-[#F2F5E8]",
    accentColor: "text-[#6B7C3A]",
  },
  {
    emoji: "🚨",
    title: "유기동물을 발견하면",
    subtitle: "바로 제보해요",
    description: "지도에 위치와 함께 제보하고\n빠른 구조를 도와요",
    bg: "bg-orange-50",
    accentColor: "text-orange-600",
  },
  {
    emoji: "🏠",
    title: "임시보호와 입양으로",
    subtitle: "새 가족을 찾아줘요",
    description: "보호가 필요한 동물에게\n따뜻한 가정을 연결해요",
    bg: "bg-amber-50",
    accentColor: "text-amber-600",
  },
  {
    emoji: "🔒",
    title: "인증된 사람들끼리",
    subtitle: "안전하게 이용해요",
    description: "검증된 사용자들과 함께\n신뢰 있는 커뮤니티를 만들어요",
    bg: "bg-stone-100",
    accentColor: "text-stone-600",
  },
];

export default function OnboardingOverlay() {
  const [status, setStatus] = useState<"loading" | "show" | "hidden">("loading");
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem("onboarding_done");
    setStatus(done ? "hidden" : "show");
  }, []);

  function dismiss() {
    localStorage.setItem("onboarding_done", "1");
    setStatus("hidden");
  }

  function next() {
    if (current < SLIDES.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      dismiss();
    }
  }

  // 로그인 폼 잠깐 노출 방지
  if (status === "loading") {
    return <div className="fixed inset-0 z-50 bg-[#F2F5E8]" />;
  }

  if (status === "hidden") return null;

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${slide.bg} transition-colors duration-300`}>
      {/* 건너뛰기 */}
      <div className="flex justify-end px-6 pt-14 pb-2">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-xl px-3 py-1.5 text-sm text-stone-400 hover:text-stone-600 hover:bg-black/5 transition-colors"
        >
          건너뛰기
        </button>
      </div>

      {/* 슬라이드 콘텐츠 */}
      <div className="flex flex-1 flex-col items-center justify-center px-10 text-center gap-5">
        {slide.logo ? (
          <>
            <Image
              src="/woojusoulicon.png"
              alt="우주소울 로고"
              width={216}
              height={216}
              priority
              style={{ mixBlendMode: "multiply" }}
            />
            <div className="flex flex-col items-center gap-2">
              <h2
                className="text-4xl font-bold tracking-widest"
                style={{ color: "#4a5e2a" }}
              >
                우주소울
              </h2>
              <p className="text-base italic text-stone-400">
                <span style={{ color: "#6B7C3A" }} className="font-semibold">우</span>
                리&nbsp;
                <span style={{ color: "#6B7C3A" }} className="font-semibold">주</span>
                변&nbsp;
                <span style={{ color: "#6B7C3A" }} className="font-semibold">Soul</span>
              </p>
              <p className="mt-2 text-sm text-stone-500">
                &ldquo;우리 주변의 모든 생명을 지켜요&rdquo;
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/60 text-6xl shadow-sm">
              {slide.emoji}
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-2xl font-bold text-stone-900 leading-snug">
                {slide.title}
              </h2>
              <p className={`text-lg font-semibold ${slide.accentColor}`}>
                {slide.subtitle}
              </p>
            </div>
            {slide.description && (
              <p className="text-sm text-stone-500 leading-relaxed whitespace-pre-line max-w-[260px]">
                {slide.description}
              </p>
            )}
          </>
        )}
      </div>

      {/* 하단 컨트롤 */}
      <div className="flex flex-col items-center gap-6 px-6 pb-16">
        {/* 도트 인디케이터 */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}번 슬라이드로 이동`}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-200 ${
                i === current
                  ? "w-6 h-2 bg-amber-500"
                  : "w-2 h-2 bg-stone-300 hover:bg-stone-400"
              }`}
            />
          ))}
        </div>

        {/* 다음 / 시작하기 */}
        <button
          type="button"
          onClick={next}
          className="w-full max-w-xs rounded-2xl bg-amber-500 py-4 text-base font-bold text-white shadow-sm hover:bg-amber-600 active:bg-amber-700 transition-colors"
        >
          {isLast ? "시작하기" : "다음"}
        </button>
      </div>
    </div>
  );
}
