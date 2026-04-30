"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useKakaoMaps } from "@/hooks/useKakaoMaps";
import { Loader2 } from "lucide-react";

interface Props {
  lat: number;
  lng: number;
  showExact: boolean;
}

export function MiniMap({ lat, lng, showExact }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const isLoaded = useKakaoMaps();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!containerRef.current || mapRef.current) return;

    const { kakao } = window;
    const latlng = new kakao.maps.LatLng(lat, lng);

    const map = new kakao.maps.Map(containerRef.current, {
      center: latlng,
      level: showExact ? 4 : 5,
    });

    // 카드 안이므로 스크롤·드래그·줌 전부 비활성화
    map.setDraggable(false);
    map.setZoomable(false);

    mapRef.current = map;

    if (showExact) {
      new kakao.maps.Marker({ map, position: latlng });
    } else {
      // 반경 500m 반투명 원
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
    }
  }, [isLoaded, lat, lng, showExact]);

  return (
    <div
      style={{
        position: "relative",
        height: "160px",
        borderRadius: "var(--r-md)",
        overflow: "hidden",
        marginTop: "12px",
        border: "1px solid var(--border)",
        background: "var(--surface-2)",
      }}
    >
      {/* SDK 로딩 중 스피너 */}
      {!isLoaded && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
        }}>
          <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      )}

      {/* 지도 컨테이너 */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* 투명 클릭 인터셉터 — 지도 인터랙션 전부 차단, 클릭 시 /map 이동 */}
      <div
        style={{ position: "absolute", inset: 0, zIndex: 2, cursor: "pointer" }}
        onClick={(e) => { e.stopPropagation(); router.push("/map"); }}
      />

      {/* 비승인 안내 오버레이 */}
      {!showExact && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 3,
          background: "rgba(0,0,0,0.52)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          padding: "7px 12px",
          color: "white",
          fontSize: "11px",
          fontWeight: 500,
          textAlign: "center",
          lineHeight: "1.45",
        }}>
          위치 열람 신청 후 정확한 위치를 확인할 수 있어요
        </div>
      )}
    </div>
  );
}
