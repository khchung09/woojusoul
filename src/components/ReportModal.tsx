"use client";

import { useState, useTransition } from "react";
import { Flag, X, CheckCircle2 } from "lucide-react";
import { reportPost } from "@/lib/actions";

const REASONS: { value: string; label: string }[] = [
  { value: "spam", label: "스팸" },
  { value: "abusive", label: "욕설·혐오" },
  { value: "animal_abuse", label: "동물 학대 의심" },
  { value: "inappropriate", label: "부적절한 내용" },
  { value: "other", label: "기타" },
];

interface Props {
  postId: string;
  reportedUserId: string;
  onClose: () => void;
}

export default function ReportModal({ postId, reportedUserId, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!selected) return;
    setErrorMsg(null);
    startTransition(async () => {
      const result = await reportPost(postId, reportedUserId, selected);
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
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <p className="text-base font-bold text-stone-900">신고가 접수됐어요</p>
            <p className="text-sm text-center text-stone-500">
              검토 후 적절한 조치를 취할게요.
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
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag size={16} className="text-red-500" />
                <h3 className="text-base font-bold text-stone-900">신고하기</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mb-3 text-sm text-stone-500">신고 사유를 선택해 주세요.</p>

            <div className="flex flex-col gap-2">
              {REASONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelected(value)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                    selected === value
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {errorMsg && <p className="mt-3 text-sm text-red-500">{errorMsg}</p>}

            <div className="mt-5 flex gap-2">
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
                disabled={!selected || isPending}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isPending ? "신고 중..." : "신고하기"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
