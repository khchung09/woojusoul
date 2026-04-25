"use client";

import { useEffect, useRef, useState } from "react";
import { useKakaoMaps } from "@/hooks/useKakaoMaps";
import type { ReportPost } from "@/types/models";
import { MapPin, Loader2, X } from "lucide-react";
import { formatDistanceToNow } from "@/lib/dateUtils";

const ANIMAL_TYPE_LABEL: Record<string, string> = {
  cat: "🐱 고양이",
  dog: "🐶 강아지",
  other: "🐾 기타",
};

const STATUS_STYLE: Record<string, string> = {
  rescue_needed: "bg-red-500 text-white",
  protected: "bg-amber-500 text-white",
  rescued: "bg-green-500 text-white",
};

const STATUS_LABEL: Record<string, string> = {
  rescue_needed: "구조필요",
  protected: "보호중",
  rescued: "구조완료",
};

interface Props {
  posts: ReportPost[];
  isVerified: boolean;
}

export function ReportMapView({ posts, isVerified }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const isLoaded = useKakaoMaps();
  const [selectedPost, setSelectedPost] = useState<ReportPost | null>(null);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;

    const { kakao } = window;

    // 지도 중심: 게시물 평균 좌표 or 서울 시청
    const avgLat =
      posts.length > 0
        ? posts.reduce((s, p) => s + p.latitude, 0) / posts.length
        : 37.5665;
    const avgLng =
      posts.length > 0
        ? posts.reduce((s, p) => s + p.longitude, 0) / posts.length
        : 126.978;

    const map = new kakao.maps.Map(containerRef.current, {
      center: new kakao.maps.LatLng(avgLat, avgLng),
      level: posts.length > 0 ? 8 : 7,
    });
    mapRef.current = map;

    posts.forEach((post) => {
      const latlng = new kakao.maps.LatLng(post.latitude, post.longitude);

      if (isVerified) {
        // 인증 유저: 정확한 핀
        const marker = new kakao.maps.Marker({ map, position: latlng });
        kakao.maps.event.addListener(marker, "click", () => setSelectedPost(post));
      } else {
        // 일반 유저: 반경 500m 반투명 원 + 흐린 중심 점
        new kakao.maps.Circle({
          center: latlng,
          radius: 500,
          strokeWeight: 1,
          strokeColor: "#D97706",
          strokeOpacity: 0.35,
          fillColor: "#F59E0B",
          fillOpacity: 0.15,
          map,
        });

        // 클릭 가능한 흐린 점
        const dot = document.createElement("div");
        dot.style.cssText =
          "width:28px;height:28px;border-radius:50%;background:rgba(245,158,11,0.65);filter:blur(5px);cursor:pointer;transform:translate(-50%,-50%);";
        dot.onclick = () => setSelectedPost(post);

        new kakao.maps.CustomOverlay({
          position: latlng,
          content: dot,
          map,
          zIndex: 10,
          xAnchor: 0,
          yAnchor: 0,
        });
      }
    });
  }, [isLoaded, posts, isVerified]);

  return (
    <div className="flex flex-col gap-3">
      {!isVerified && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
          <MapPin size={13} className="mt-0.5 shrink-0" />
          <span>
            위치는 반경 500m 범위로만 표시됩니다. 정확한 위치는 인증된 회원만 확인할 수 있어요.
          </span>
        </div>
      )}

      <div
        className="relative w-full overflow-hidden rounded-2xl border border-stone-100 shadow-sm"
        style={{ height: "calc(100dvh - 220px)", minHeight: 380 }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
            <Loader2 size={24} className="animate-spin text-stone-400" />
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {selectedPost && (
        <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-stone-900">
              {selectedPost.profiles?.display_name ??
                selectedPost.profiles?.username ??
                "알 수 없음"}
            </p>
            <button
              onClick={() => setSelectedPost(null)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mb-2.5 flex flex-wrap gap-1.5">
            {selectedPost.animal_status && (
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[selectedPost.animal_status]}`}>
                {STATUS_LABEL[selectedPost.animal_status]}
              </span>
            )}
            {selectedPost.animal_type && (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                {ANIMAL_TYPE_LABEL[selectedPost.animal_type]}
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
              <MapPin size={9} />
              {isVerified && selectedPost.location_address
                ? selectedPost.location_address
                : selectedPost.location ?? "위치 정보 없음"}
            </span>
          </div>

          <p className="line-clamp-3 text-sm leading-relaxed text-stone-700">
            {selectedPost.content}
          </p>
          <p className="mt-2 text-xs text-stone-400">
            {formatDistanceToNow(selectedPost.created_at)}
          </p>
        </div>
      )}
    </div>
  );
}
