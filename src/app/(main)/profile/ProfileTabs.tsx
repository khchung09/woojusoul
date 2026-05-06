"use client";

import { useState, type ReactNode } from "react";

type Tab = "posts" | "bookmarks" | "pets";

type Props = {
  postsContent: ReactNode;
  bookmarksContent: ReactNode;
  petsContent: ReactNode;
};

const TAB_LABELS: Record<Tab, string> = {
  posts: "내 게시물",
  bookmarks: "북마크",
  pets: "내 반려동물",
};

export default function ProfileTabs({ postsContent, bookmarksContent, petsContent }: Props) {
  const [tab, setTab] = useState<Tab>("posts");

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
        {(["posts", "bookmarks", "pets"] as Tab[]).map((t) => {
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
              {TAB_LABELS[t]}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 */}
      <div key={tab} style={{ animation: "fadeIn 0.2s ease forwards" }}>
        {tab === "posts" ? postsContent : tab === "bookmarks" ? bookmarksContent : petsContent}
      </div>
    </div>
  );
}
