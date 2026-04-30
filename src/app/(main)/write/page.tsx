"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, X, ImagePlus, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { LocationPicker, type LocationData } from "@/components/LocationPicker";
import { updatePost, createPost } from "@/lib/actions";
import { MentionInput } from "@/components/MentionInput";

type PostType = "general" | "report" | "temp_protect" | "adoption";
type AnimalSpecies = "cat" | "dog" | "other";
type AnimalStatus = "rescue_needed" | "protected" | "rescued";
type Gender = "male" | "female" | "unknown";
type HealthStatus = "good" | "treatment" | "warning";
type NeuteredStatus = "yes" | "no" | "unknown";

const POST_TYPES: {
  value: PostType;
  label: string;
  emoji: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  { value: "general", label: "일반글", emoji: "💬", desc: "일상을 공유해요", color: "var(--accent)", bg: "var(--accent-bg)", border: "var(--accent)" },
  { value: "report", label: "제보", emoji: "🚨", desc: "유기동물을 발견했어요", color: "var(--danger)", bg: "var(--danger-bg)", border: "var(--danger)" },
  { value: "temp_protect", label: "임시보호 구함", emoji: "🏠", desc: "임시보호를 구해요", color: "var(--warning)", bg: "var(--warning-bg)", border: "var(--warning)" },
  { value: "adoption", label: "입양보냄", emoji: "💛", desc: "새 가족을 찾아요", color: "var(--gold)", bg: "var(--gold-bg)", border: "var(--gold)" },
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

const HEALTH_OPTIONS: { value: HealthStatus; label: string; color: string; bg: string }[] = [
  { value: "good", label: "양호", color: "var(--accent)", bg: "var(--accent-bg)" },
  { value: "treatment", label: "치료중", color: "var(--warning)", bg: "var(--warning-bg)" },
  { value: "warning", label: "요주의", color: "var(--danger)", bg: "var(--danger-bg)" },
];

const NEUTERED_OPTIONS: { value: NeuteredStatus; label: string }[] = [
  { value: "yes", label: "완료" },
  { value: "no", label: "미완료" },
  { value: "unknown", label: "모름" },
];

const REPORT_STATUS_OPTIONS: { value: AnimalStatus; label: string; color: string; bg: string }[] = [
  { value: "rescue_needed", label: "구조필요", color: "var(--danger)", bg: "var(--danger-bg)" },
  { value: "protected", label: "보호중", color: "var(--warning)", bg: "var(--warning-bg)" },
  { value: "rescued", label: "구조완료", color: "var(--accent)", bg: "var(--accent-bg)" },
];

const MAX_IMAGES = 6;
const CONTENT_LIMIT: Record<PostType, number> = {
  general: 500,
  report: 500,
  temp_protect: 300,
  adoption: 300,
};

function ChipBtn({
  active,
  onClick,
  color,
  bg,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: "var(--r-pill)",
        border: `1.5px solid ${active ? color : "var(--border)"}`,
        background: active ? bg : "var(--surface)",
        color: active ? color : "var(--text-secondary)",
        padding: "6px 14px",
        fontSize: "13px",
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s ease",
      }}
      onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.95)"; }}
      onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
    >
      {children}
    </button>
  );
}

function SectionBox({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <div
      style={{
        borderRadius: "var(--r-lg)",
        border: `1.5px solid ${color}`,
        background: bg,
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {children}
    </p>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: "var(--r-md)",
  border: "1.5px solid var(--border)",
  background: "var(--surface)",
  padding: "10px 14px",
  fontSize: "14px",
  color: "var(--text-primary)",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

function parseImageUrls(imageUrl: string | null): string[] {
  if (!imageUrl) return [];
  if (imageUrl.startsWith("[")) {
    try { return JSON.parse(imageUrl) as string[]; } catch { return [imageUrl]; }
  }
  return [imageUrl];
}

function buildTempProtectContent(
  fields: { name: string; species: AnimalSpecies; age: string; gender: Gender; health: HealthStatus; personality: string; period: string },
  description: string
): string {
  return JSON.stringify({ _postFormat: "temp_protect", ...fields, description: description.trim() });
}

function buildAdoptionContent(
  fields: { name: string; species: AnimalSpecies; age: string; gender: Gender; neutered: NeuteredStatus; health: HealthStatus; personality: string; conditions: string },
  description: string
): string {
  return JSON.stringify({ _postFormat: "adoption", ...fields, description: description.trim() });
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editPostId) return;
    async function loadPost() {
      const supabase = createClient();
      const { data: post } = await supabase.from("posts").select("*").eq("id", editPostId!).single();
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
            setLocationData({ location: post.location, locationAddress: post.location_address ?? "", lat: post.latitude ?? 0, lng: post.longitude ?? 0 });
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const newImageUrls = imageFiles.length > 0 ? await uploadImages(user.id) : [];
      const allImageUrls = [...existingImageUrls, ...newImageUrls];
      const imageUrlValue = allImageUrls.length === 0 ? null : allImageUrls.length === 1 ? allImageUrls[0] : JSON.stringify(allImageUrls);

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
        const result = await createPost(postData);
        if (result.error) throw new Error(result.error);
        router.push("/feed");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요.");
      setLoading(false);
    }
  }

  const currentTypeConfig = POST_TYPES.find((t) => t.value === postType);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", paddingBottom: "40px" }}>
      {/* 헤더 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "rgba(247,246,243,0.94)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 0 16px",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => router.back()}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "100px",
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-secondary)",
              transition: "transform 0.12s ease",
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.92)"; }}
            onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            {isEditMode ? "게시물 수정" : "새 글 쓰기"}
          </h1>
        </div>
        <Button
          type="submit"
          form="write-form"
          size="sm"
          loading={loading}
          disabled={!canSubmit}
          style={{ minWidth: "72px" }}
        >
          {isEditMode ? "수정" : "게시하기"}
        </Button>
      </div>

      <form id="write-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* 카테고리 2x2 그리드 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          {POST_TYPES.map((type) => {
            const active = postType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => !isEditMode && setPostType(type.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  borderRadius: "var(--r-lg)",
                  border: `2px solid ${active ? type.border : "var(--border)"}`,
                  background: active ? type.bg : "var(--surface)",
                  padding: "14px 16px",
                  textAlign: "left",
                  cursor: isEditMode ? "not-allowed" : "pointer",
                  opacity: isEditMode && !active ? 0.4 : 1,
                  transition: "all 0.15s ease",
                }}
                onMouseDown={(e) => { if (!isEditMode) (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
                onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              >
                <span style={{ fontSize: "22px" }}>{type.emoji}</span>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: active ? type.color : "var(--text-primary)", margin: "0 0 1px" }}>
                    {type.label}
                    {active && (
                      <span style={{
                        marginLeft: "6px",
                        fontSize: "11px",
                        background: type.color,
                        color: "white",
                        borderRadius: "100px",
                        padding: "1px 6px",
                        verticalAlign: "middle",
                      }}>✓</span>
                    )}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{type.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* 제보 폼 */}
        {isReport && (
          <SectionBox color="rgba(192,57,43,0.3)" bg="var(--danger-bg)">
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--danger)", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              📍 제보 정보
            </p>
            <div>
              <FieldLabel>발견 위치 (지도에 마커로 표시됩니다)</FieldLabel>
              <LocationPicker onSelect={setLocationData} initial={locationData ?? undefined} />
              {!locationData && (
                <p style={{ fontSize: "12px", color: "var(--danger)", margin: "6px 0 0", opacity: 0.8 }}>
                  지도를 클릭해 위치를 선택해야 지도에서 확인할 수 있어요
                </p>
              )}
            </div>
            <div>
              <FieldLabel>동물 종류</FieldLabel>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {SPECIES_OPTIONS.map((s) => (
                  <ChipBtn key={s.value} active={reportSpecies === s.value} onClick={() => setReportSpecies(s.value)} color="var(--danger)" bg="var(--danger-bg)">
                    {s.emoji} {s.label}
                  </ChipBtn>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>현재 상태</FieldLabel>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {REPORT_STATUS_OPTIONS.map((s) => (
                  <ChipBtn key={s.value} active={reportStatus === s.value} onClick={() => setReportStatus(s.value)} color={s.color} bg={s.bg}>
                    {s.label}
                  </ChipBtn>
                ))}
              </div>
            </div>
          </SectionBox>
        )}

        {/* 임시보호 폼 */}
        {isTempProtect && (
          <SectionBox color="rgba(212,120,42,0.3)" bg="var(--warning-bg)">
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--warning)", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              🏠 동물 정보
            </p>
            <div>
              <FieldLabel>종류</FieldLabel>
              <div style={{ display: "flex", gap: "6px" }}>
                {SPECIES_OPTIONS.map((s) => (
                  <ChipBtn key={s.value} active={animalSpecies === s.value} onClick={() => setAnimalSpecies(s.value)} color="var(--warning)" bg="var(--warning-bg)">
                    {s.emoji} {s.label}
                  </ChipBtn>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <FieldLabel>이름 (선택)</FieldLabel>
                <input type="text" value={animalName} onChange={(e) => setAnimalName(e.target.value)} placeholder="예: 콩이" maxLength={20} style={inputStyle} />
              </div>
              <div>
                <FieldLabel>나이</FieldLabel>
                <input type="text" value={animalAge} onChange={(e) => setAnimalAge(e.target.value)} placeholder="예: 2살" maxLength={20} style={inputStyle} />
              </div>
            </div>
            <div>
              <FieldLabel>성별</FieldLabel>
              <div style={{ display: "flex", gap: "6px" }}>
                {GENDER_OPTIONS.map((g) => (
                  <ChipBtn key={g.value} active={animalGender === g.value} onClick={() => setAnimalGender(g.value)} color="var(--warning)" bg="var(--warning-bg)">{g.label}</ChipBtn>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>건강상태</FieldLabel>
              <div style={{ display: "flex", gap: "6px" }}>
                {HEALTH_OPTIONS.map((h) => (
                  <ChipBtn key={h.value} active={healthStatus === h.value} onClick={() => setHealthStatus(h.value)} color={h.color} bg={h.bg}>{h.label}</ChipBtn>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>성격 특징</FieldLabel>
              <input type="text" value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="예: 활발하고 애교가 많아요" maxLength={100} style={inputStyle} />
            </div>
            <div>
              <FieldLabel>임시보호 가능 기간</FieldLabel>
              <input type="text" value={availablePeriod} onChange={(e) => setAvailablePeriod(e.target.value)} placeholder="예: 2주, 1개월, 기간 협의 가능" maxLength={50} style={inputStyle} />
            </div>
          </SectionBox>
        )}

        {/* 입양보냄 폼 */}
        {isAdoption && (
          <SectionBox color="rgba(184,150,46,0.3)" bg="var(--gold-bg)">
            <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--gold)", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              💛 동물 정보
            </p>
            <div>
              <FieldLabel>종류</FieldLabel>
              <div style={{ display: "flex", gap: "6px" }}>
                {SPECIES_OPTIONS.map((s) => (
                  <ChipBtn key={s.value} active={animalSpecies === s.value} onClick={() => setAnimalSpecies(s.value)} color="var(--gold)" bg="var(--gold-bg)">
                    {s.emoji} {s.label}
                  </ChipBtn>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <FieldLabel>이름 (선택)</FieldLabel>
                <input type="text" value={animalName} onChange={(e) => setAnimalName(e.target.value)} placeholder="예: 콩이" maxLength={20} style={inputStyle} />
              </div>
              <div>
                <FieldLabel>나이</FieldLabel>
                <input type="text" value={animalAge} onChange={(e) => setAnimalAge(e.target.value)} placeholder="예: 2살" maxLength={20} style={inputStyle} />
              </div>
            </div>
            <div>
              <FieldLabel>성별</FieldLabel>
              <div style={{ display: "flex", gap: "6px" }}>
                {GENDER_OPTIONS.map((g) => (
                  <ChipBtn key={g.value} active={animalGender === g.value} onClick={() => setAnimalGender(g.value)} color="var(--gold)" bg="var(--gold-bg)">{g.label}</ChipBtn>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>중성화 여부</FieldLabel>
              <div style={{ display: "flex", gap: "6px" }}>
                {NEUTERED_OPTIONS.map((n) => (
                  <ChipBtn key={n.value} active={neuteredStatus === n.value} onClick={() => setNeuteredStatus(n.value)} color="var(--gold)" bg="var(--gold-bg)">{n.label}</ChipBtn>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>건강상태</FieldLabel>
              <div style={{ display: "flex", gap: "6px" }}>
                {HEALTH_OPTIONS.map((h) => (
                  <ChipBtn key={h.value} active={healthStatus === h.value} onClick={() => setHealthStatus(h.value)} color={h.color} bg={h.bg}>{h.label}</ChipBtn>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>성격 특징</FieldLabel>
              <input type="text" value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="예: 온순하고 사람을 좋아해요" maxLength={100} style={inputStyle} />
            </div>
            <div>
              <FieldLabel>입양 조건/희망사항</FieldLabel>
              <textarea
                value={adoptionConditions}
                onChange={(e) => setAdoptionConditions(e.target.value)}
                placeholder="예: 마당이 있는 집, 선입묘 없는 가정"
                rows={2}
                maxLength={150}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>
          </SectionBox>
        )}

        {/* 본문 작성 */}
        <div
          style={{
            borderRadius: "var(--r-lg)",
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            overflow: "hidden",
          }}
        >
          {isComplex && (
            <div style={{ padding: "14px 16px 0" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                상세 내용
              </p>
            </div>
          )}
          <MentionInput
            value={activeContent}
            onChange={(v) => (isComplex ? setDescription(v) : setContent(v))}
            placeholder={
              isComplex
                ? "추가로 전달하고 싶은 내용을 자유롭게 적어주세요 (선택)"
                : isReport
                ? "동물을 발견한 상황을 자세히 적어주세요."
                : "오늘 반려동물과 있었던 일을 공유해보세요 🐾"
            }
            rows={isComplex ? 4 : 6}
            wrapperClassName="w-full"
            className="w-full resize-none text-sm leading-relaxed"
            style={{
              width: "100%",
              resize: "none",
              fontSize: "15px",
              lineHeight: "1.65",
              color: "var(--text-primary)",
              background: "transparent",
              border: "none",
              outline: "none",
              padding: "16px",
              fontFamily: "inherit",
              display: "block",
            } as React.CSSProperties}
            autoFocus={!isComplex}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 16px 14px",
              borderTop: "1px solid var(--surface-2)",
            }}
          >
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>@ #</span>
            <span style={{ fontSize: "12px", color: contentOver ? "var(--danger)" : "var(--text-muted)" }}>
              {activeContent.length} / {contentLimit}
            </span>
          </div>
        </div>

        {/* 이미지 섹션 */}
        <div
          style={{
            borderRadius: "var(--r-lg)",
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            padding: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>사진</p>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{totalImages} / {MAX_IMAGES}</span>
          </div>

          {(existingImageUrls.length > 0 || imagePreviews.length > 0) && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", overflowX: "auto" }}>
              {existingImageUrls.map((url, i) => (
                <div key={`existing-${i}`} style={{ position: "relative", flexShrink: 0, width: "72px", height: "72px" }}>
                  <img src={url} alt={`이미지 ${i + 1}`} style={{ width: "100%", height: "100%", borderRadius: "var(--r-sm)", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(i)}
                    style={{
                      position: "absolute", top: "-5px", right: "-5px",
                      width: "20px", height: "20px", borderRadius: "100px",
                      background: "var(--text-primary)", color: "white", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {imagePreviews.map((src, i) => (
                <div key={`new-${i}`} style={{ position: "relative", flexShrink: 0, width: "72px", height: "72px" }}>
                  <img src={src} alt={`미리보기 ${i + 1}`} style={{ width: "100%", height: "100%", borderRadius: "var(--r-sm)", objectFit: "cover" }} />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    style={{
                      position: "absolute", top: "-5px", right: "-5px",
                      width: "20px", height: "20px", borderRadius: "100px",
                      background: "var(--text-primary)", color: "white", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}
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
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderRadius: "var(--r-md)",
                border: "1.5px dashed var(--border)",
                background: "transparent",
                padding: "12px",
                fontSize: "13px",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "border-color 0.15s ease, color 0.15s ease",
              }}
            >
              <ImagePlus size={16} />
              사진 추가 (최대 {MAX_IMAGES}장)
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFilesChange} />
        </div>

        {/* 위치 (일반/비제보) */}
        {!isReport && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              borderRadius: "var(--r-md)",
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              padding: "13px 16px",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: "14px",
            }}
          >
            <MapPin size={16} />
            <span>위치 추가 (선택)</span>
          </div>
        )}

        {error && (
          <p style={{ fontSize: "14px", color: "var(--danger)", margin: 0, padding: "12px 16px", borderRadius: "var(--r-md)", background: "var(--danger-bg)" }}>
            {error}
          </p>
        )}
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
