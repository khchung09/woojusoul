"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
  bio: string;
  avatar_url: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const { error } = await supabase
    .from("profiles")
    .update({
      bio: data.bio || null,
      avatar_url: data.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
}

export async function updateUsername(
  newUsername: string
): Promise<{ error?: string }> {
  if (!/^[a-z0-9_]{3,20}$/.test(newUsername)) {
    return { error: "영문 소문자, 숫자, _ 만 가능해요 (3~20자)" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, username_updated_at")
    .eq("id", user.id)
    .single();

  if (profile?.username === newUsername) return {};

  if (profile?.username_updated_at) {
    const daysSince = Math.floor(
      (Date.now() - new Date(profile.username_updated_at).getTime()) / 86_400_000
    );
    if (daysSince < 30) {
      return { error: `${30 - daysSince}일 후에 변경할 수 있어요` };
    }
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", newUsername)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) return { error: "이미 사용 중인 아이디예요" };

  const { error } = await supabase
    .from("profiles")
    .update({
      username: newUsername,
      username_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: "변경에 실패했어요" };

  revalidatePath("/profile");
  return {};
}
