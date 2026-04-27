"use client";

import { useState, useTransition } from "react";
import { followUser, unfollowUser } from "@/lib/actions";

interface Props {
  targetUserId: string;
  initialIsFollowing: boolean;
}

export default function FollowButton({ targetUserId, initialIsFollowing }: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovering, setIsHovering] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !isFollowing;
    setIsFollowing(next);
    startTransition(async () => {
      if (next) {
        await followUser(targetUserId);
      } else {
        await unfollowUser(targetUserId);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      disabled={isPending}
      className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
        isFollowing
          ? isHovering
            ? "bg-red-50 text-red-600 border border-red-200"
            : "bg-stone-100 text-stone-600 border border-stone-200"
          : "bg-amber-500 text-white hover:bg-amber-600"
      }`}
    >
      {isFollowing ? (isHovering ? "언팔로우" : "팔로잉") : "팔로우"}
    </button>
  );
}
