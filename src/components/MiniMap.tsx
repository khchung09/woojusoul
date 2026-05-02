"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useKakaoMaps } from "@/hooks/useKakaoMaps";
import { Loader2 } from "lucide-react";

interface Props {
  lat: number;
  lng: number;
  showExact: boolean;
  postId: string;
}

export function MiniMap({ lat, lng, showExact, postId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const isLoaded = useKakaoMaps();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  // 뷰포트 진입 감지 — 한번 보이면 계속 유지
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isVisible) return;
    if (!containerRef.current) return;

    const { kakao } = window;

    // 이전 지도 완전히 제거
    if (mapRef.current) {
      containerRef.current.innerHTML = "";
      mapRef.current = null;
    }

    const realLatlng = new kakao.maps.LatLng(lat, lng);

    if (showExact) {
      const map = new kakao.maps.Map(containerRef.current, {
        center: realLatlng,
        level: 4,
      });
      map.setDraggable(false);
      map.setZoomable(false);
      mapRef.current = map;
      new kakao.maps.Marker({ map, position: realLatlng });
    } else {
      const offsetLat = lat + (Math.random() - 0.5) * 0.004;
      const offsetLng = lng + (Math.random() - 0.5) * 0.004;
      const offsetLatlng = new kakao.maps.LatLng(offsetLat, offsetLng);
      const map = new kakao.maps.Map(containerRef.current, {
        center: offsetLatlng,
        level: 5,
      });
      map.setDraggable(false);
      map.setZoomable(false);
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
  }, [isLoaded, isVisible, lat, lng, showExact]);

  return (
    <div
      ref={wrapperRef}
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
      {/* 뷰포트 밖 — 스켈레톤 */}
      {!isVisible && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "var(--surface-2)",
        }} />
      )}

      {/* SDK 로딩 중 스피너 */}
      {isVisible && !isLoaded && (
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
        onClick={(e) => {
          console.log("이동 URL:", `/map?post_id=${postId}`);
          e.stopPropagation();
          router.push(`/map?post_id=${postId}`);
        }}
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
