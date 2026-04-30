"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Camera, X, Check, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile, updateUsername } from "./actions";
import type { Profile } from "@/types/models";

type Props = {
  profile: Profile;
  userEmail: string;
  postCount: number;
  petCount: number;
  followerCount: number;
  followingCount: number;
};

export default function ProfileEditor({ profile, userEmail, postCount, petCount, followerCount, followingCount }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const lastChanged = profile.username_updated_at;
  const daysSince = lastChanged
    ? Math.floor((Date.now() - new Date(lastChanged).getTime()) / 86_400_000)
    : 30;
  const canChangeUsername = daysSince >= 30;
  const daysLeft = canChangeUsername ? 0 : 30 - daysSince;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleCancel() {
    setUsername(profile.username);
    setBio(profile.bio ?? "");
    setAvatarPreview(null);
    setAvatarFile(null);
    setError(null);
    setIsEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      try {
        if (username !== profile.username) {
          if (!canChangeUsername) {
            setError(`${daysLeft}일 후에 아이디를 변경할 수 있어요`);
            return;
          }
          const result = await updateUsername(username);
          if (result.error) { setError(result.error); return; }
        }

        let finalAvatarUrl: string | null = avatarUrl || null;
        if (avatarFile) {
          const supabase = createClient();
          const ext = avatarFile.name.split(".").pop() ?? "jpg";
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(`${profile.id}.${ext}`, avatarFile, { upsert: true });
          if (uploadError) throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
          const { data } = supabase.storage.from("avatars").getPublicUrl(`${profile.id}.${ext}`);
          finalAvatarUrl = data.publicUrl;
        }

        await updateProfile({ bio, avatar_url: finalAvatarUrl });
        setAvatarUrl(finalAvatarUrl ?? "");
        setAvatarPreview(null);
        setAvatarFile(null);
        setIsEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "저장에 실패했어요");
      }
    });
  }

  const currentAvatar = avatarPreview ?? avatarUrl;

  return (
    <div
      style={{
        borderRadius: "var(--r-lg)",
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      {/* 배너 */}
      <div
        style={{
          height: "120px",
          background: "linear-gradient(135deg, var(--accent-bg) 0%, #D4E8C2 100%)",
          position: "relative",
        }}
      />

      {/* 프로필 영역 */}
      <div style={{ padding: "0 20px 24px" }}>
        {/* 아바타 (배너에 overlap) */}
        <div style={{ position: "relative", display: "inline-block", marginTop: "-40px", marginBottom: "12px" }}>
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt="프로필 사진"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "100px",
                objectFit: "cover",
                border: "3px solid var(--surface)",
                boxShadow: "var(--shadow-md)",
              }}
            />
          ) : (
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "100px",
                background: "var(--accent-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                border: "3px solid var(--surface)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              🐾
            </div>
          )}
          {isEditing && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: "absolute",
                  bottom: "2px",
                  right: "2px",
                  width: "26px",
                  height: "26px",
                  borderRadius: "100px",
                  background: "var(--accent)",
                  color: "white",
                  border: "2px solid var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <Camera size={12} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
            </>
          )}
        </div>

        {/* 이름 + 수정 버튼 */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-muted)" }}>@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    disabled={!canChangeUsername}
                    maxLength={20}
                    style={{
                      flex: 1,
                      borderRadius: "var(--r-md)",
                      border: "1.5px solid var(--border)",
                      background: "var(--surface-2)",
                      padding: "8px 12px",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      fontFamily: "inherit",
                      outline: "none",
                      opacity: canChangeUsername ? 1 : 0.5,
                    }}
                  />
                </div>
                {!canChangeUsername && (
                  <p style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-muted)" }}>
                    {daysLeft}일 후 변경 가능해요
                  </p>
                )}
              </div>
            ) : (
              <h1 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                @{profile.username}
              </h1>
            )}
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              style={{
                borderRadius: "var(--r-pill)",
                border: "1.5px solid var(--border)",
                background: "var(--surface)",
                padding: "7px 16px",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "transform 0.12s ease",
                flexShrink: 0,
              }}
            >
              프로필 편집
            </button>
          )}
        </div>

        {/* 자기소개 */}
        <div style={{ marginTop: "10px" }}>
          {isEditing ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="자기소개를 입력해 주세요"
              maxLength={200}
              rows={3}
              style={{
                width: "100%",
                borderRadius: "var(--r-md)",
                border: "1.5px solid var(--border)",
                background: "var(--surface-2)",
                padding: "10px 12px",
                fontSize: "14px",
                color: "var(--text-primary)",
                fontFamily: "inherit",
                outline: "none",
                resize: "none",
                boxSizing: "border-box",
              }}
            />
          ) : bio ? (
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0 }}>{bio}</p>
          ) : null}
        </div>

        {/* 이메일 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
          <Mail size={13} style={{ color: "var(--text-muted)" }} />
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{userEmail}</span>
        </div>

        {/* 통계 */}
        <div
          style={{
            display: "flex",
            gap: "0",
            marginTop: "20px",
            paddingTop: "20px",
            borderTop: "1.5px solid var(--border)",
          }}
        >
          {[
            { value: postCount, label: "게시물" },
            { value: followerCount, label: "팔로워" },
            { value: followingCount, label: "팔로잉" },
            { value: petCount, label: "반려동물" },
          ].map(({ value, label }) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <p style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 2px" }}>{value}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* 에러 */}
        {error && (
          <div
            style={{
              marginTop: "14px",
              borderRadius: "var(--r-md)",
              background: "var(--danger-bg)",
              padding: "10px 14px",
              fontSize: "13px",
              color: "var(--danger)",
            }}
          >
            {error}
          </div>
        )}

        {/* 편집 버튼 */}
        {isEditing && (
          <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              style={{
                borderRadius: "var(--r-pill)",
                border: "1.5px solid var(--border)",
                background: "var(--surface)",
                padding: "9px 18px",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
                cursor: "pointer",
                fontFamily: "inherit",
                opacity: isPending ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <X size={14} /> 취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              style={{
                borderRadius: "var(--r-pill)",
                background: "var(--accent)",
                border: "none",
                padding: "9px 20px",
                fontSize: "14px",
                fontWeight: 600,
                color: "white",
                cursor: "pointer",
                fontFamily: "inherit",
                opacity: isPending ? 0.5 : 1,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Check size={14} /> {isPending ? "저장 중..." : "저장"}
            </button>
          </div>
        )}

        {/* 로그아웃 — 모바일용, 편집 중엔 숨김, md 이상에선 사이드바에서 처리 */}
        {!isEditing && (
          <div className="md:hidden" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1.5px solid var(--border)" }}>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                borderRadius: "var(--r-pill)",
                border: "1.5px solid var(--border)",
                background: "var(--surface)",
                padding: "10px",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "transform 0.12s ease",
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
