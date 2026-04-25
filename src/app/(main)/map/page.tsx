import { createClient } from "@/lib/supabase/server";
import { ReportMapView } from "@/components/ReportMapView";
import { MapPin } from "lucide-react";
import Link from "next/link";
import type { PostWithAuthor, ReportPost } from "@/types/models";

export default async function MapPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified")
    .eq("id", user!.id)
    .single();

  const isVerified = profile?.is_verified ?? false;

  const { data } = await supabase
    .from("posts")
    .select(
      `*, profiles (username, display_name, avatar_url)`
    )
    .eq("post_type", "report")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const posts = ((data as PostWithAuthor[] | null) ?? []).filter(
    (p): p is ReportPost => p.latitude !== null && p.longitude !== null
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">제보 지도</h1>
          <p className="mt-0.5 text-xs text-stone-400">
            유기동물 제보 위치를 지도에서 확인해요
          </p>
        </div>
        {isVerified && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
            ✓ 인증 회원
          </span>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-stone-400">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
            <MapPin size={36} className="text-amber-300" />
          </div>
          <p className="text-base font-semibold text-stone-500">
            아직 위치 정보가 없어요
          </p>
          <p className="mt-1 text-sm text-stone-400">
            제보 작성 시 위치를 추가해 보세요
          </p>
          <Link
            href="/write"
            className="mt-5 rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
          >
            제보하기
          </Link>
        </div>
      ) : (
        <ReportMapView posts={posts} isVerified={isVerified} />
      )}
    </div>
  );
}
