import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ReportMapView } from "@/components/ReportMapView";
import { MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { PostWithAuthor, ReportPost } from "@/types/models";

function BackBtn() {
  return (
    <Link
      href="/feed"
      aria-label="뒤로 가기"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 transition-colors hover:bg-stone-50"
    >
      <ArrowLeft size={18} />
    </Link>
  );
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const focusPostId = await searchParams.then(p => typeof p.post_id === "string" ? p.post_id : undefined);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("is_verified, role").eq("id", user.id).single()
    : { data: null };

  const isAdmin = profile?.role === "admin";

  console.log("focusPostId:", focusPostId);

  // 해당 게시물 하나만 조회 (post_id 있을 때) — ID로만 조회, 추가 필터 없음
  let postData: PostWithAuthor | null = null;
  if (focusPostId) {
    const { data, error: postError } = await supabase
      .from("posts")
      .select(`*, profiles (username, avatar_url)`)
      .eq("id", focusPostId)
      .maybeSingle();
    console.log("focusPost:", data, "error:", postError);
    postData = data as PostWithAuthor | null;
  }

  console.log("postData:", postData);
  console.log("focusPostId:", focusPostId);

  // post_id 없거나 게시물 조회 실패 → 빈 상태 화면
  if (!focusPostId || !postData) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <h1 className="text-xl font-bold text-stone-900">제보 지도</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
            <MapPin size={36} className="text-amber-300" />
          </div>
          <p className="text-sm text-stone-400 text-center">
            피드에서 제보 게시물의 지도를 클릭하면 위치를 확인할 수 있어요
          </p>
          <Link
            href="/feed"
            className="rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
          >
            피드로 이동
          </Link>
        </div>
      </div>
    );
  }

  // 좌표 없는 게시물은 지도 표시 불가 — 빈 화면으로 처리
  if (postData.latitude === null || postData.longitude === null) {
    console.log("좌표 없음:", focusPostId);
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <BackBtn />
          <h1 className="text-xl font-bold text-stone-900">제보 지도</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
            <MapPin size={36} className="text-amber-300" />
          </div>
          <p className="text-sm text-stone-400 text-center">
            해당 게시물에 위치 정보가 없어요
          </p>
          <Link
            href="/feed"
            className="rounded-2xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors"
          >
            피드로 이동
          </Link>
        </div>
      </div>
    );
  }

  const post = postData as ReportPost;
  const isOwn = user?.id === post.author_id;

  // 정확한 위치 표시 여부 결정
  let showExact = !!(isAdmin || isOwn);
  if (!showExact && user) {
    const { data: approvalData } = await createServiceClient()
      .from("location_requests")
      .select("id")
      .eq("post_id", focusPostId)
      .eq("requester_id", user.id)
      .eq("status", "approved")
      .maybeSingle();
    showExact = !!approvalData;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BackBtn />
          <h1 className="text-xl font-bold text-stone-900">제보 지도</h1>
        </div>
        {isAdmin && (
          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
            👑 관리자
          </span>
        )}
        {user && !isAdmin && profile?.is_verified && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
            ✓ 인증 회원
          </span>
        )}
      </div>

      <ReportMapView post={post} showExact={showExact} />
    </div>
  );
}
