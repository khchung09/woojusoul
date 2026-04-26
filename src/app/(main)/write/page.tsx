"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, X, ImagePlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { LocationPicker, type LocationData } from "@/components/LocationPicker";
import { updatePost } from "@/lib/actions";

type PostType = "general" | "report" | "temp_protect" | "adoption";
type AnimalSpecies = "cat" | "dog" | "other";
type AnimalStatus = "rescue_needed" | "protected" | "rescued";
type Gender = "male" | "female" | "unknown";
type HealthStatus = "good" | "treatment" | "warning";
type NeuteredStatus = "yes" | "no" | "unknown";

const POST_TYPES: { value: PostType; label: string; emoji: string; desc: string }[] = [
  { value: "general", label: "일반글", emoji: "💬", desc: "일상을 공유해요" },
  { value: "report", label: "제보", emoji: "🚨", desc: "유기동물을 발견했어요" },
  { value: "temp_protect", label: "임시보호구함", emoji: "🏠", desc: "임시보호를 구해요" },
  { value: "adoption", label: "입양보냄", emoji: "💛", desc: "새 가족을 찾아요" },
];

const SPECIES_OPTIONS: { value: AnimalSpecies; label: string; emoji: string }[] = [
  { value: "dog", label: "강아지", emoji: "🐶" },
  { value: "cat", label: "고양이", emoji: "🐱" },
  { value: "other", label: "기타", emoji: "🐾" },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "수컷" },
  { value: "female", label: "암컷" },
  { value: "unknown", label: "모름" },
];

const HEALTH_OPTIONS: { value: HealthStatus; label: string }[] = [
  { value: "good", label: "양호" },
  { value: "treatment", label: "치료중" },
  { value: "warning", label: "요주의" },
];

const NEUTERED_OPTIONS: { value: NeuteredStatus; label: string }[] = [
  { value: "yes", label: "완료" },
  { value: "no", label: "미완료" },
  { value: "unknown", label: "모름" },
];

const REPORT_STATUS_OPTIONS: { value: AnimalStatus; label: string }[] = [
  { value: "rescue_needed", label: "구조필요" },
  { value: "protected", label: "보호중" },
  { value: "rescued", label: "구조완료" },
];

const MAX_IMAGES = 6;
const CONTENT_LIMIT: Record<PostType, number> = {
  general: 500,
  report: 500,
  temp_protect: 300,
  adoption: 300,
};

function SelectBtn({
  active,
  onClick,
  activeClass,
  children,
}: {
  active: boolean;
  onClick: () => void;
  activeClass: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-all ${
        active
          ? activeClass
          : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
      }`}
    >
      {children}
    </button>
  );
}

function healthActiveClass(h: HealthStatus) {
  return h === "good"
    ? "border-green-400 bg-green-100 text-green-700"
    : h === "treatment"
    ? "border-amber-400 bg-amber-100 text-amber-700"
    : "border-red-400 bg-red-100 text-red-700";
}

const inputBase =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none";

function parseImageUrls(imageUrl: string | null): string[] {
  if (!imageUrl) return [];
  if (imageUrl.startsWith("[")) {
    try {
      return JSON.parse(imageUrl) as string[];
    } catch {
      return [imageUrl];
    }
  }
  return [imageUrl];
}

function buildTempProtectContent(
  fields: { name: string; species: AnimalSpecies; age: string; gender: Gender; health: HealthStatus; personality: string; period: string },
  description: string
): string {
  return JSON.stringify({
    _postFormat: "temp_protect",
    species: fields.species,
    name: fields.name,
    age: fields.age,
    gender: fields.gender,
    health: fields.health,
    personality: fields.personality,
    period: fields.period,
    description: description.trim(),
  });
}

function buildAdoptionContent(
  fields: { name: string; species: AnimalSpecies; age: string; gender: Gender; neutered: NeuteredStatus; health: HealthStatus; personality: string; conditions: string },
  description: string
): string {
  return JSON.stringify({
    _postFormat: "adoption",
    species: fields.species,
    name: fields.name,
    age: fields.age,
    gender: fields.gender,
    neutered: fields.neutered,
    health: fields.health,
    personality: fields.personality,
    conditions: fields.conditions,
    description: description.trim(),
  });
}

function WritePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPostId = searchParams.get("edit");
  const isEditMode = !!editPostId;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [postType, setPostType] = useState<PostType>("general");
  const [content, setContent] = useState("");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [reportSpecies, setReportSpecies] = useState<AnimalSpecies>("dog");
  const [reportStatus, setReportStatus] = useState<AnimalStatus>("rescue_needed");

  const [animalName, setAnimalName] = useState("");
  const [animalSpecies, setAnimalSpecies] = useState<AnimalSpecies>("dog");
  const [animalAge, setAnimalAge] = useState("");
  const [animalGender, setAnimalGender] = useState<Gender>("unknown");
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("good");
  const [personality, setPersonality] = useState("");

  const [availablePeriod, setAvailablePeriod] = useState("");

  const [neuteredStatus, setNeuteredStatus] = useState<NeuteredStatus>("unknown");
  const [adoptionConditions, setAdoptionConditions] = useState("");

  const [description, setDescription] = useState("");

  // 새로 추가하는 이미지 파일
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // 수정 모드: 기존 업로드된 이미지 URL
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 수정 모드: 기존 게시물 데이터 로드
  useEffect(() => {
    if (!editPostId) return;

    async function loadPost() {
      const supabase = createClient();
      const { data: post } = await supabase
        .from("posts")
        .select("*")
        .eq("id", editPostId!)
        .single();

      if (!post) return;

      setPostType(post.post_type);

      if (post.post_type === "temp_protect" || post.post_type === "adoption") {
        try {
          const parsed = JSON.parse(post.content) as Record<string, string>;
          if (parsed._postFormat) {
            setAnimalSpecies((parsed.species as AnimalSpecies) ?? "dog");
            setAnimalName(parsed.name ?? "");
            setAnimalAge(parsed.age ?? "");
            setAnimalGender((parsed.gender as Gender) ?? "unknown");
            setHealthStatus((parsed.health as HealthStatus) ?? "good");
            setPersonality(parsed.personality ?? "");
            if (post.post_type === "temp_protect") {
              setAvailablePeriod(parsed.period ?? "");
            } else {
              setNeuteredStatus((parsed.neutered as NeuteredStatus) ?? "unknown");
              setAdoptionConditions(parsed.conditions ?? "");
            }
            setDescription(parsed.description ?? "");
          } else {
            setDescription(post.content);
          }
        } catch {
          setDescription(post.content);
        }
      } else {
        setContent(post.content);
        if (post.post_type === "report") {
          setReportSpecies((post.animal_type as AnimalSpecies) ?? "dog");
          setReportStatus((post.animal_status as AnimalStatus) ?? "rescue_needed");
          if (post.location) {
            setLocationData({
              location: post.location,
              locationAddress: post.location_address ?? "",
              lat: post.latitude ?? 0,
              lng: post.longitude ?? 0,
            });
          }
        }
      }

      setExistingImageUrls(parseImageUrls(post.image_url));
    }

    loadPost();
  }, [editPostId]);

  const isReport = postType === "report";
  const isTempProtect = postType === "temp_protect";
  const isAdoption = postType === "adoption";
  const isComplex = isTempProtect || isAdoption;

  const activeContent = isComplex ? description : content;
  const contentLimit = CONTENT_LIMIT[postType];
  const contentOver = activeContent.length > contentLimit;
  const totalImages = existingImageUrls.length + imageFiles.length;
  const canSubmit = !loading && !contentOver && (isComplex || activeContent.trim().length > 0);

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_IMAGES - totalImages;
    const added = files.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...added]);
    setImagePreviews((prev) => [...prev, ...added.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removeNewImage(i: number) {
    URL.revokeObjectURL(imagePreviews[i]);
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  function removeExistingImage(i: number) {
    const url = existingImageUrls[i];
    setRemovedImageUrls((prev) => [...prev, url]);
    setExistingImageUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function uploadImages(userId: string): Promise<string[]> {
    const supabase = createClient();
    const urls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("posts").upload(path, file);
      if (upErr) throw new Error(`이미지 업로드 실패: ${upErr.message}`);
      const { data } = supabase.storage.from("posts").getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const newImageUrls = imageFiles.length > 0 ? await uploadImages(user.id) : [];
      const allImageUrls = [...existingImageUrls, ...newImageUrls];
      const imageUrlValue =
        allImageUrls.length === 0
          ? null
          : allImageUrls.length === 1
          ? allImageUrls[0]
          : JSON.stringify(allImageUrls);

      let finalContent: string;
      if (isTempProtect) {
        finalContent = buildTempProtectContent(
          { name: animalName, species: animalSpecies, age: animalAge, gender: animalGender, health: healthStatus, personality, period: availablePeriod },
          description
        );
      } else if (isAdoption) {
        finalContent = buildAdoptionContent(
          { name: animalName, species: animalSpecies, age: animalAge, gender: animalGender, neutered: neuteredStatus, health: healthStatus, personality, conditions: adoptionConditions },
          description
        );
      } else {
        finalContent = content.trim();
      }

      const postData = {
        content: finalContent,
        image_url: imageUrlValue,
        post_type: postType,
        location: isReport ? (locationData?.location ?? null) : null,
        location_address: isReport ? (locationData?.locationAddress ?? null) : null,
        latitude: isReport ? (locationData?.lat ?? null) : null,
        longitude: isReport ? (locationData?.lng ?? null) : null,
        animal_type: isReport ? reportSpecies : isComplex ? animalSpecies : null,
        animal_status: isReport ? reportStatus : null,
      } as const;

      if (isEditMode && editPostId) {
        await updatePost(editPostId, postData, removedImageUrls);
        router.back();
      } else {
        const { error: insertErr } = await supabase.from("posts").insert({
          author_id: user.id,
          ...postData,
        });
        if (insertErr) throw new Error("게시물을 올리지 못했어요. 다시 시도해 주세요.");
        router.push("/feed");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
      setLoading(false);
    }
  }

  const imageSection = (
    <div className="rounded-2xl bg-white shadow-sm border border-stone-100 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">이미지</p>
        <span className="text-xs text-stone-400">
          {totalImages} / {MAX_IMAGES}
        </span>
      </div>

      {(existingImageUrls.length > 0 || imagePreviews.length > 0) && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          {existingImageUrls.map((url, i) => (
            <div key={`existing-${i}`} className="relative aspect-square">
              <img src={url} alt={`이미지 ${i + 1}`} className="h-full w-full rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => removeExistingImage(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-700 text-white shadow"
              >
                <X size={10} />
              </button>
            </div>
          ))}
          {imagePreviews.map((src, i) => (
            <div key={`new-${i}`} className="relative aspect-square">
              <img src={src} alt={`미리보기 ${i + 1}`} className="h-full w-full rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => removeNewImage(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-700 text-white shadow"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {totalImages < MAX_IMAGES && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 py-3 text-sm text-stone-400 hover:border-amber-400 hover:text-amber-500 transition-colors"
        >
          <ImagePlus size={16} />
          사진 추가 (최대 {MAX_IMAGES}장)
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesChange} />
    </div>
  );

  const contentSection = (
    <div className="rounded-2xl bg-white shadow-sm border border-stone-100 p-4">
      {isComplex && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">상세 내용</p>
      )}
      <textarea
        value={activeContent}
        onChange={(e) => (isComplex ? setDescription(e.target.value) : setContent(e.target.value))}
        placeholder={
          isComplex
            ? "추가로 전달하고 싶은 내용을 자유롭게 적어주세요 (선택)"
            : isReport
            ? "동물을 발견한 상황을 자세히 적어주세요."
            : "오늘 반려동물과 있었던 일을 공유해보세요 🐾"
        }
        rows={isComplex ? 4 : 6}
        className="w-full resize-none text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none leading-relaxed"
        autoFocus={!isComplex}
      />
      <div className="mt-2 flex justify-end">
        <span className={`text-xs ${contentOver ? "text-red-400" : "text-stone-400"}`}>
          {activeContent.length} / {contentLimit}
        </span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-stone-900">
          {isEditMode ? "게시물 수정" : "글쓰기"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-2">
          {POST_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => !isEditMode && setPostType(type.value)}
              className={`flex items-center gap-2.5 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                postType === type.value
                  ? "border-amber-400 bg-amber-50"
                  : isEditMode
                  ? "border-stone-100 bg-stone-50 opacity-40 cursor-not-allowed"
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

        {/* 제보 폼 */}
        {isReport && (
          <div className="flex flex-col gap-4 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">제보 정보</p>

            <div>
              <p className="mb-2 text-xs text-stone-500">발견 위치</p>
              <LocationPicker onSelect={setLocationData} initial={locationData ?? undefined} />
            </div>

            <div>
              <p className="mb-2 text-xs text-stone-500">동물 종류</p>
              <div className="flex gap-2">
                {SPECIES_OPTIONS.map((s) => (
                  <SelectBtn
                    key={s.value}
                    active={reportSpecies === s.value}
                    onClick={() => setReportSpecies(s.value)}
                    activeClass="border-red-400 bg-red-100 text-red-700"
                  >
                    <span className="mr-1">{s.emoji}</span>
                    {s.label}
                  </SelectBtn>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs text-stone-500">현재 상태</p>
              <div className="flex gap-2">
                {REPORT_STATUS_OPTIONS.map((s) => (
                  <SelectBtn
                    key={s.value}
                    active={reportStatus === s.value}
                    onClick={() => setReportStatus(s.value)}
                    activeClass={
                      s.value === "rescue_needed"
                        ? "border-red-400 bg-red-100 text-red-700"
                        : s.value === "protected"
                        ? "border-amber-400 bg-amber-100 text-amber-700"
                        : "border-green-400 bg-green-100 text-green-700"
                    }
                  >
                    {s.label}
                  </SelectBtn>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 임시보호 폼 */}
        {isTempProtect && (
          <div className="flex flex-col gap-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">동물 정보</p>

            <div>
              <p className="mb-2 text-xs text-stone-500">종류</p>
              <div className="flex gap-2">
                {SPECIES_OPTIONS.map((s) => (
                  <SelectBtn
                    key={s.value}
                    active={animalSpecies === s.value}
                    onClick={() => setAnimalSpecies(s.value)}
                    activeClass="border-amber-400 bg-amber-100 text-amber-700"
                  >
                    <span className="mr-1">{s.emoji}</span>
                    {s.label}
                  </SelectBtn>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-xs text-stone-500">이름 (선택)</p>
                <input
                  type="text"
                  value={animalName}
                  onChange={(e) => setAnimalName(e.target.value)}
                  placeholder="예: 콩이"
                  maxLength={20}
                  className={`${inputBase} focus:border-amber-400`}
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs text-stone-500">나이</p>
                <input
                  type="text"
                  value={animalAge}
                  onChange={(e) => setAnimalAge(e.target.value)}
                  placeholder="예: 2살"
                  maxLength={20}
                  className={`${inputBase} focus:border-amber-400`}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs text-stone-500">성별</p>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <SelectBtn
                    key={g.value}
                    active={animalGender === g.value}
                    onClick={() => setAnimalGender(g.value)}
                    activeClass="border-amber-400 bg-amber-100 text-amber-700"
                  >
                    {g.label}
                  </SelectBtn>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs text-stone-500">건강상태</p>
              <div className="flex gap-2">
                {HEALTH_OPTIONS.map((h) => (
                  <SelectBtn
                    key={h.value}
                    active={healthStatus === h.value}
                    onClick={() => setHealthStatus(h.value)}
                    activeClass={healthActiveClass(h.value)}
                  >
                    {h.label}
                  </SelectBtn>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs text-stone-500">성격 특징</p>
              <input
                type="text"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="예: 활발하고 애교가 많아요"
                maxLength={100}
                className={`${inputBase} focus:border-amber-400`}
              />
            </div>

            <div>
              <p className="mb-1.5 text-xs text-stone-500">임시보호 가능 기간</p>
              <input
                type="text"
                value={availablePeriod}
                onChange={(e) => setAvailablePeriod(e.target.value)}
                placeholder="예: 2주, 1개월, 기간 협의 가능"
                maxLength={50}
                className={`${inputBase} focus:border-amber-400`}
              />
            </div>
          </div>
        )}

        {/* 입양보냄 폼 */}
        {isAdoption && (
          <div className="flex flex-col gap-4 rounded-2xl border border-green-100 bg-green-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">동물 정보</p>

            <div>
              <p className="mb-2 text-xs text-stone-500">종류</p>
              <div className="flex gap-2">
                {SPECIES_OPTIONS.map((s) => (
                  <SelectBtn
                    key={s.value}
                    active={animalSpecies === s.value}
                    onClick={() => setAnimalSpecies(s.value)}
                    activeClass="border-green-400 bg-green-100 text-green-700"
                  >
                    <span className="mr-1">{s.emoji}</span>
                    {s.label}
                  </SelectBtn>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-xs text-stone-500">이름 (선택)</p>
                <input
                  type="text"
                  value={animalName}
                  onChange={(e) => setAnimalName(e.target.value)}
                  placeholder="예: 콩이"
                  maxLength={20}
                  className={`${inputBase} focus:border-green-400`}
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs text-stone-500">나이</p>
                <input
                  type="text"
                  value={animalAge}
                  onChange={(e) => setAnimalAge(e.target.value)}
                  placeholder="예: 2살"
                  maxLength={20}
                  className={`${inputBase} focus:border-green-400`}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs text-stone-500">성별</p>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <SelectBtn
                    key={g.value}
                    active={animalGender === g.value}
                    onClick={() => setAnimalGender(g.value)}
                    activeClass="border-green-400 bg-green-100 text-green-700"
                  >
                    {g.label}
                  </SelectBtn>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs text-stone-500">중성화 여부</p>
              <div className="flex gap-2">
                {NEUTERED_OPTIONS.map((n) => (
                  <SelectBtn
                    key={n.value}
                    active={neuteredStatus === n.value}
                    onClick={() => setNeuteredStatus(n.value)}
                    activeClass="border-green-400 bg-green-100 text-green-700"
                  >
                    {n.label}
                  </SelectBtn>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs text-stone-500">건강상태</p>
              <div className="flex gap-2">
                {HEALTH_OPTIONS.map((h) => (
                  <SelectBtn
                    key={h.value}
                    active={healthStatus === h.value}
                    onClick={() => setHealthStatus(h.value)}
                    activeClass={healthActiveClass(h.value)}
                  >
                    {h.label}
                  </SelectBtn>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs text-stone-500">성격 특징</p>
              <input
                type="text"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="예: 온순하고 사람을 좋아해요"
                maxLength={100}
                className={`${inputBase} focus:border-green-400`}
              />
            </div>

            <div>
              <p className="mb-1.5 text-xs text-stone-500">입양 조건/희망사항</p>
              <textarea
                value={adoptionConditions}
                onChange={(e) => setAdoptionConditions(e.target.value)}
                placeholder="예: 마당이 있는 집, 선입묘 없는 가정"
                rows={2}
                maxLength={150}
                className={`${inputBase} resize-none focus:border-green-400`}
              />
            </div>
          </div>
        )}

        {contentSection}
        {imageSection}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" size="lg" loading={loading} disabled={!canSubmit} className="w-full">
          {isEditMode ? "수정 완료" : "게시하기"}
        </Button>
      </form>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense>
      <WritePageContent />
    </Suspense>
  );
}
