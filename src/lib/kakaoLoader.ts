let loadPromise: Promise<void> | null = null;

export function loadKakaoMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.kakao?.maps?.Map) return Promise.resolve();
  if (loadPromise) return loadPromise;

  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  if (!apiKey) {
    console.warn(
      "[KakaoMaps] NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수가 설정되지 않았습니다. " +
        ".env.local을 확인하고 개발 서버를 재시작해 주세요."
    );
    return Promise.reject(new Error("Kakao Maps API 키 없음"));
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Kakao Maps SDK 로드 실패"));
    document.head.appendChild(script);
  });

  return loadPromise;
}
