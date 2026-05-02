"use client";

import { useEffect, useRef } from "react";
import { useKakaoMaps } from "@/hooks/useKakaoMaps";
import type { ReportPost } from "@/types/models";
import { MapPin, Loader2 } from "lucide-react";
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
  post: ReportPost;
  showExact: boolean;
}

export function ReportMapView({ post, showExact }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const isLoaded = useKakaoMaps();

  useEffect(() => {
    console.log("ReportMapView showExact:", showExact, "post.id:", post.id);
    if (!isLoaded) return;
    if (!containerRef.current) return;

    // 이전 지도 완전히 제거 후 재생성
    if (mapRef.current) {
      containerRef.current.innerHTML = "";
      mapRef.current = null;
    }

    const { kakao } = window;

    if (showExact) {
      const latlng = new kakao.maps.LatLng(post.latitude, post.longitude);
      const map = new kakao.maps.Map(containerRef.current, {
        center: latlng,
        level: 4,
      });
      mapRef.current = map;
      new kakao.maps.Marker({ map, position: latlng });
    } else {
      // 랜덤 오프셋으로 실제 위치 노출 방지 — 중심점 없이 500m 원만 표시
      const offsetLat = post.latitude + (Math.random() - 0.5) * 0.004;
      const offsetLng = post.longitude + (Math.random() - 0.5) * 0.004;
      const offsetLatlng = new kakao.maps.LatLng(offsetLat, offsetLng);
      const map = new kakao.maps.Map(containerRef.current, {
        center: offsetLatlng,
        level: 5,
      });
      mapRef.current = map;
      new kakao.maps.Circle({
        center: offsetLatlng,
        radius: 500,
        strokeWeight: 1,
        strokeColor: "#D97706",
        strokeOpacity: 0.35,
        fillColor: "#F59E0B",
        fillOpacity: 0.15,
        map,
      });
    }
  }, [isLoaded, post, showExact]);

  const displayLocation = showExact && post.location_address
    ? post.location_address
    : post.location ?? "위치 정보 없음";

  return (
    <div className="flex flex-col gap-3">
      {!showExact && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
          <MapPin size={13} className="mt-0.5 shrink-0" />
          <span>
            위치는 반경 500m 범위로만 표시됩니다. 정확한 위치는 위치 열람 승인 후 확인할 수 있어요.
          </span>
        </div>
      )}

      <div
        className="relative w-full overflow-hidden rounded-2xl border border-stone-100 shadow-sm"
        style={{ height: "calc(100dvh - 400px)", minHeight: 260 }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
            <Loader2 size={24} className="animate-spin text-stone-400" />
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>

      {/* 게시물 카드 — 항상 표시 */}
      <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
        <p className="mb-2 text-sm font-semibold text-stone-900">
          @{post.profiles?.username ?? "알 수 없음"}
        </p>

        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {post.animal_status && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[post.animal_status]}`}>
              {STATUS_LABEL[post.animal_status]}
            </span>
          )}
          {post.animal_type && (
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
              {ANIMAL_TYPE_LABEL[post.animal_type]}
            </span>
          )}
          <span className="flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
            <MapPin size={9} />
            {displayLocation}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-stone-700">
          {post.content}
        </p>
        <p className="mt-2 text-xs text-stone-400">
          {formatDistanceToNow(post.created_at)}
        </p>
      </div>
    </div>
  );
}
