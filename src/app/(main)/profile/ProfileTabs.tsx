"use client";

import { useState, type ReactNode } from "react";

type Props = {
  petsContent: ReactNode;
  postsContent: ReactNode;
};

export default function ProfileTabs({ petsContent, postsContent }: Props) {
  const [tab, setTab] = useState<"posts" | "pets">("posts");

  return (
    <div>
      {/* 탭 헤더 */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid var(--border)",
          marginBottom: "16px",
        }}
      >
        {(["posts", "pets"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "12px 0",
                fontSize: "14px",
                fontWeight: active ? 700 : 500,
                color: active ? "var(--accent)" : "var(--text-muted)",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                marginBottom: "-2px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "color 0.15s ease, border-color 0.15s ease, transform 0.12s ease",
              }}
              onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              {t === "posts" ? "내 게시물" : "내 반려동물"}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 */}
      <div
        key={tab}
        style={{ animation: "fadeIn 0.2s ease forwards" }}
      >
        {tab === "posts" ? postsContent : petsContent}
      </div>
    </div>
  );
}
