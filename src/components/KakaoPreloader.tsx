"use client";

import { useEffect } from "react";
import { loadKakaoMaps } from "@/lib/kakaoLoader";

// 레이아웃에서 Kakao Maps SDK를 백그라운드로 미리 로드 — 지도 탭 진입 시 즉시 표시
export function KakaoPreloader() {
  useEffect(() => {
    loadKakaoMaps().catch(() => {});
  }, []);
  return null;
}
