"use client";

import { useState, useRef, useTransition } from "react";
import { Mail, Camera, Pencil, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "./actions";
import type { Profile } from "@/types/models";

type Props = {
  profile: Profile;
  userEmail: string;
  postCount: number;
  petCount: number;
};

export default function ProfileEditor({ profile, userEmail, postCount, petCount }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleCancel() {
    setDisplayName(profile.display_name ?? "");
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
        let finalAvatarUrl: string | null = avatarUrl || null;

        if (avatarFile) {
          const supabase = createClient();
          const ext = avatarFile.name.split(".").pop() ?? "jpg";
          const fileName = `${profile.id}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, avatarFile, { upsert: true });

          if (uploadError) throw new Error(`이미지 업로드 실패: ${uploadError.message}`);

          const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
          finalAvatarUrl = data.publicUrl;
        }

        await updateProfile({ display_name: displayName, bio, avatar_url: finalAvatarUrl });

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
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        {/* 아바타 */}
        <div className="relative shrink-0">
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt="프로필 사진"
              className="h-16 w-16 rounded-full object-cover ring-2 ring-amber-100"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-2xl font-bold text-amber-600">
              {(displayName || profile.username)[0] ?? "?"}
            </div>
          )}
          {isEditing && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-md hover:bg-amber-600 transition-colors"
              >
                <Camera size={12} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </>
          )}
        </div>

        {/* 이름 / 사용자명 */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={30}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-base font-semibold text-stone-900 focus:border-amber-400 focus:bg-white focus:outline-none"
            />
          ) : (
            <h1 className="text-xl font-bold text-stone-900 truncate">
              {displayName || profile.username}
            </h1>
          )}
          <p className="mt-0.5 text-sm text-stone-500">@{profile.username}</p>
        </div>

        {/* 수정 버튼 */}
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 rounded-xl bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <Pencil size={12} />
            수정
          </button>
        )}
      </div>

      {/* 자기소개 */}
      <div className="mt-4">
        {isEditing ? (
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="자기소개를 입력해 주세요"
            maxLength={200}
            rows={3}
            className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700 focus:border-amber-400 focus:bg-white focus:outline-none resize-none"
          />
        ) : bio ? (
          <p className="text-sm text-stone-700 leading-relaxed">{bio}</p>
        ) : null}
      </div>

      {/* 이메일 */}
      <div className="mt-3 flex items-center gap-1.5 text-sm text-stone-400">
        <Mail size={14} />
        <span>{userEmail}</span>
      </div>

      {/* 통계 */}
      <div className="mt-4 flex gap-6 border-t border-stone-100 pt-4">
        <div className="text-center">
          <p className="text-lg font-bold text-stone-900">{postCount}</p>
          <p className="text-xs text-stone-400">게시물</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-stone-900">{petCount}</p>
          <p className="text-xs text-stone-400">반려동물</p>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
      )}

      {/* 저장 / 취소 버튼 */}
      {isEditing && (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            <X size={14} />
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            <Check size={14} />
            {isPending ? "저장 중..." : "저장"}
          </button>
        </div>
      )}
    </div>
  );
}
