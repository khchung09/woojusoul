import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportMapView } from "@/components/ReportMapView";
import { MapPin } from "lucide-react";
import Link from "next/link";
import type { PostWithAuthor, ReportPost } from "@/types/models";

export default async function MapPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified, role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const [{ data: postsData, error: postsError }, { data: approvedData }] = await Promise.all([
    supabase
      .from("posts")
      // display_name 제거 — profiles에 해당 컬럼 없으면 쿼리 전체 실패
      .select(`*, profiles (username, avatar_url)`)
      .eq("post_type", "report")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("created_at", { ascending: false })
      .limit(200),
    isAdmin
      ? Promise.resolve({ data: [] })
      : supabase
          .from("location_requests")
          .select("post_id")
          .eq("requester_id", user.id)
          .eq("status", "approved"),
  ]);

  if (postsError) {
    console.error("[MapPage] posts 쿼리 실패:", postsError.message);
  }

  const posts = ((postsData as PostWithAuthor[] | null) ?? []).filter(
    (p): p is ReportPost => p.latitude !== null && p.longitude !== null
  );

  const approvedPostIds = (approvedData ?? []).map((r) => r.post_id as string);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-900">제보 지도</h1>
          <p className="mt-0.5 text-xs text-stone-400">
            유기동물 제보 위치를 지도에서 확인해요
          </p>
        </div>
        {isAdmin && (
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
            👑 관리자
          </span>
        )}
        {!isAdmin && profile?.is_verified && (
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
        <ReportMapView
          posts={posts}
          approvedPostIds={approvedPostIds}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
