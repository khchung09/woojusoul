"use client";

import { useEffect, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakaoLoader";

export function useKakaoMaps(): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // SDK가 이미 로드된 경우(이전 페이지 방문 등) 즉시 반환
    if (window.kakao?.maps?.Map) {
      setLoaded(true);
      return;
    }
    loadKakaoMaps().then(() => setLoaded(true)).catch(console.error);
  }, []);

  return loaded;
}
