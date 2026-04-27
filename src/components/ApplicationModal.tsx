"use client";

import { useState, useTransition } from "react";
import { X, CheckCircle2, Send } from "lucide-react";
import { submitApplication } from "@/lib/actions";

interface Props {
  postId: string;
  postType: "temp_protect" | "adoption";
  onClose: () => void;
}

const HOUSING_OPTIONS = ["아파트", "빌라", "주택", "기타"] as const;
const INTRO_MAX = 300;

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors ${
        selected
          ? "border-amber-400 bg-amber-50 text-amber-700"
          : "border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
      }`}
    >
      {label}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">
      {children}
    </p>
  );
}

export default function ApplicationModal({ postId, postType, onClose }: Props) {
  const [housingType, setHousingType] = useState<string | null>(null);
  const [petExperience, setPetExperience] = useState<boolean | null>(null);
  const [period, setPeriod] = useState("");
  const [intro, setIntro] = useState("");
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const typeLabel = postType === "temp_protect" ? "임시보호" : "입양";
  const isValid = housingType !== null && petExperience !== null;

  function handleSubmit() {
    if (!isValid) return;
    setErrorMsg(null);
    const message = JSON.stringify({ housingType, petExperience, period, intro });
    startTransition(async () => {
      const result = await submitApplication(postId, message);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setDone(true);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden">
        {done ? (
          <div className="flex flex-col items-center gap-3 p-6 py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <CheckCircle2 size={28} className="text-amber-600" />
            </div>
            <p className="text-base font-bold text-stone-900">{typeLabel} 신청이 완료됐어요</p>
            <p className="text-sm text-center text-stone-500">
              작성자가 신청을 확인하면 연락드릴 거예요.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">{typeLabel} 신청</h3>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* 스크롤 영역 */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-4 flex flex-col gap-5">
              {/* 신청자 기본 정보 */}
              <div className="rounded-xl bg-stone-50 p-4 flex flex-col gap-4">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  신청자 기본 정보
                </p>

                <div>
                  <FieldLabel>거주 형태</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {HOUSING_OPTIONS.map((opt) => (
                      <OptionButton
                        key={opt}
                        label={opt}
                        selected={housingType === opt}
                        onClick={() => setHousingType(opt)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <FieldLabel>반려동물 양육 경험</FieldLabel>
                  <div className="flex gap-2">
                    <OptionButton
                      label="있음"
                      selected={petExperience === true}
                      onClick={() => setPetExperience(true)}
                    />
                    <OptionButton
                      label="없음"
                      selected={petExperience === false}
                      onClick={() => setPetExperience(false)}
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel>
                    {typeLabel} 가능 기간
                  </FieldLabel>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    placeholder={postType === "temp_protect" ? "예: 1개월, 2주 등" : "평생"}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>

              {/* 자기소개 */}
              <div>
                <FieldLabel>자기소개</FieldLabel>
                <textarea
                  value={intro}
                  onChange={(e) => setIntro(e.target.value.slice(0, INTRO_MAX))}
                  placeholder="신청 이유와 환경을 자유롭게 적어주세요"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-stone-200 px-3.5 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
                <p className={`mt-1 text-right text-xs ${intro.length >= INTRO_MAX ? "text-red-400" : "text-stone-400"}`}>
                  {intro.length} / {INTRO_MAX}
                </p>
              </div>

              {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
            </div>

            {/* 하단 버튼 */}
            <div className="flex gap-2 px-6 py-4 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 rounded-xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!isValid || isPending}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                <Send size={14} />
                {isPending ? "신청 중..." : "신청하기"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
