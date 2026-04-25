"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { LocationPicker, type LocationData } from "@/components/LocationPicker";

type PostType = "general" | "report" | "temp_protect" | "adoption";
type AnimalType = "cat" | "dog" | "other";
type AnimalStatus = "rescue_needed" | "protected" | "rescued";

const POST_TYPES: { value: PostType; label: string; emoji: string; desc: string }[] = [
  { value: "general", label: "일반글", emoji: "💬", desc: "일상을 공유해요" },
  { value: "report", label: "제보", emoji: "🚨", desc: "유기동물을 발견했어요" },
  { value: "temp_protect", label: "임시보호구함", emoji: "🏠", desc: "임시보호를 구해요" },
  { value: "adoption", label: "입양보냄", emoji: "💛", desc: "새 가족을 찾아요" },
];

const ANIMAL_TYPES: { value: AnimalType; label: string; emoji: string }[] = [
  { value: "cat", label: "고양이", emoji: "🐱" },
  { value: "dog", label: "강아지", emoji: "🐶" },
  { value: "other", label: "기타", emoji: "🐾" },
];

const ANIMAL_STATUSES: { value: AnimalStatus; label: string; color: string }[] = [
  { value: "rescue_needed", label: "구조필요", color: "border-red-300 bg-red-50 text-red-700 data-[selected]:border-red-500 data-[selected]:bg-red-100" },
  { value: "protected", label: "보호중", color: "border-amber-300 bg-amber-50 text-amber-700 data-[selected]:border-amber-500 data-[selected]:bg-amber-100" },
  { value: "rescued", label: "구조완료", color: "border-green-300 bg-green-50 text-green-700 data-[selected]:border-green-500 data-[selected]:bg-green-100" },
];

export default function WritePage() {
  const router = useRouter();
  const [postType, setPostType] = useState<PostType>("general");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [animalType, setAnimalType] = useState<AnimalType>("cat");
  const [animalStatus, setAnimalStatus] = useState<AnimalStatus>("rescue_needed");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isReport = postType === "report";
  const placeholders: Record<PostType, string> = {
    general: "오늘 반려동물과 있었던 일을 공유해보세요 🐾",
    report: "동물을 발견한 상황을 자세히 적어주세요. 외모 특징, 건강 상태 등을 포함하면 좋아요.",
    temp_protect: "임시보호가 필요한 동물에 대해 알려주세요. 기간, 조건 등을 함께 적어주세요.",
    adoption: "입양 보낼 동물에 대해 소개해주세요. 성격, 나이, 건강 상태 등을 적어주세요.",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError("");
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("posts").insert({
      author_id: user.id,
      content: content.trim(),
      image_url: imageUrl.trim() || null,
      post_type: postType,
      location: isReport ? locationData?.location ?? null : null,
      location_address: isReport ? locationData?.locationAddress ?? null : null,
      latitude: isReport ? locationData?.lat ?? null : null,
      longitude: isReport ? locationData?.lng ?? null : null,
      animal_type: isReport ? animalType : null,
      animal_status: isReport ? animalStatus : null,
    });

    if (error) {
      setError("게시물을 올리지 못했어요. 다시 시도해 주세요.");
      setLoading(false);
      return;
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-stone-900">글쓰기</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 글 유형 선택 */}
        <div className="grid grid-cols-2 gap-2">
          {POST_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setPostType(type.value)}
              className={`flex items-center gap-2.5 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                postType === type.value
                  ? "border-amber-400 bg-amber-50"
                  : "border-stone-100 bg-white hover:border-stone-200"
              }`}
            >
              <span className="text-xl">{type.emoji}</span>
              <div>
                <p className={`text-sm font-semibold ${postType === type.value ? "text-amber-700" : "text-stone-700"}`}>
                  {type.label}
                </p>
                <p className="text-xs text-stone-400">{type.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* 제보 추가 필드 */}
        {isReport && (
          <div className="flex flex-col gap-3 rounded-2xl bg-red-50 border border-red-100 p-4">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">제보 정보</p>

            {/* 발견 위치 - 지도 선택 */}
            <div>
              <p className="mb-2 text-xs text-stone-500">발견 위치</p>
              <LocationPicker
                onSelect={setLocationData}
                initial={locationData ?? undefined}
              />
            </div>

            {/* 동물 종류 */}
            <div>
              <p className="mb-2 text-xs text-stone-500">동물 종류</p>
              <div className="flex gap-2">
                {ANIMAL_TYPES.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setAnimalType(a.value)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-medium transition-all ${
                      animalType === a.value
                        ? "border-red-400 bg-red-100 text-red-700"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    <span>{a.emoji}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 현재 상태 */}
            <div>
              <p className="mb-2 text-xs text-stone-500">현재 상태</p>
              <div className="flex gap-2">
                {ANIMAL_STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setAnimalStatus(s.value)}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-all ${
                      animalStatus === s.value
                        ? s.value === "rescue_needed"
                          ? "border-red-400 bg-red-100 text-red-700"
                          : s.value === "protected"
                          ? "border-amber-400 bg-amber-100 text-amber-700"
                          : "border-green-400 bg-green-100 text-green-700"
                        : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 본문 입력 */}
        <div className="rounded-2xl bg-white shadow-sm border border-stone-100 p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholders[postType]}
            rows={6}
            className="w-full resize-none text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none leading-relaxed"
            autoFocus
          />

          {showImageInput && (
            <div className="mt-3 flex items-center gap-2 border-t border-stone-100 pt-3">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="이미지 URL을 입력하세요"
                className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => { setShowImageInput(false); setImageUrl(""); }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {imageUrl && (
            <img
              src={imageUrl}
              alt="미리보기"
              className="mt-3 w-full rounded-xl object-cover max-h-60"
            />
          )}

          <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={() => setShowImageInput((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm text-stone-400 hover:bg-stone-50 hover:text-stone-600 transition-colors"
            >
              <ImagePlus size={16} />
              <span>이미지</span>
            </button>
            <span className={`text-xs ${content.length > 500 ? "text-red-400" : "text-stone-400"}`}>
              {content.length} / 500
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          disabled={!content.trim() || content.length > 500}
          className="w-full"
        >
          게시하기
        </Button>
      </form>
    </div>
  );
}
