export function WoojuSoulLogo({
  size = 48,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="46" fill="#F2F5E8" stroke="#6B7C3A" strokeWidth="4.5" />

      {/* 고양이 귀 — 뾰족한 삼각형 2개 */}
      <polyline points="8,40 20,24 30,40"  fill="none" stroke="#6B7C3A" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="30,40 40,24 48,40" fill="none" stroke="#6B7C3A" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* 강아지 귀 — 둥근 아치 2개 */}
      <path d="M 52,40 C 56,24 70,24 74,40" fill="none" stroke="#6B7C3A" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M 74,40 C 78,24 90,24 93,40" fill="none" stroke="#6B7C3A" strokeWidth="4.5" strokeLinecap="round" />

      {/* 고양이 눈 */}
      <circle cx="20" cy="56" r="3" fill="#6B7C3A" />
      <circle cx="34" cy="56" r="3" fill="#6B7C3A" />

      {/* 강아지 눈 */}
      <circle cx="64" cy="56" r="3" fill="#6B7C3A" />
      <circle cx="78" cy="56" r="3" fill="#6B7C3A" />

      {/* 고양이 코 */}
      <polygon points="24,63 30,63 27,68" fill="#6B7C3A" />

      {/* 강아지 코 */}
      <polygon points="68,63 74,63 71,68" fill="#6B7C3A" />
    </svg>
  );
}
