"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  return (
    <Link
      href="/feed"
      aria-label="뒤로 가기"
      style={{
        width: "36px",
        height: "36px",
        borderRadius: "100px",
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-secondary)",
        textDecoration: "none",
        flexShrink: 0,
        transition: "transform 0.12s ease",
      }}
      onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(0.92)"; }}
      onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
    >
      <ArrowLeft size={18} />
    </Link>
  );
}
