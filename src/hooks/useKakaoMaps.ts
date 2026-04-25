"use client";

import { useEffect, useState } from "react";
import { loadKakaoMaps } from "@/lib/kakaoLoader";

export function useKakaoMaps(): boolean {
  const [loaded, setLoaded] = useState(
    typeof window !== "undefined" && !!window.kakao?.maps?.Map
  );

  useEffect(() => {
    if (loaded) return;
    loadKakaoMaps().then(() => setLoaded(true)).catch(console.error);
  }, [loaded]);

  return loaded;
}
