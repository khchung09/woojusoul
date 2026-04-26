"use client";

import { useState, type ReactNode } from "react";

type Props = {
  petsContent: ReactNode;
  postsContent: ReactNode;
};

export default function ProfileTabs({ petsContent, postsContent }: Props) {
  const [tab, setTab] = useState<"pets" | "posts">("pets");

  return (
    <div>
      <div className="flex rounded-2xl bg-stone-100 p-1 mb-4">
        <button
          type="button"
          onClick={() => setTab("pets")}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
            tab === "pets"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          내 반려동물
        </button>
        <button
          type="button"
          onClick={() => setTab("posts")}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
            tab === "posts"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          내 게시물
        </button>
      </div>

      {tab === "pets" ? petsContent : postsContent}
    </div>
  );
}
