import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/feed";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!existingProfile) {
          const meta = user.user_metadata ?? {};
          const displayName =
            meta.full_name ?? meta.name ?? meta.preferred_username ?? null;
          const avatarUrl = meta.avatar_url ?? meta.picture ?? null;
          // 카카오 uid 앞 8자로 고유 username 생성
          const username = `user_${user.id.replace(/-/g, "").slice(0, 10)}`;

          await supabase.from("profiles").insert({
            id: user.id,
            username,
            display_name: displayName,
            avatar_url: avatarUrl,
          });
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
