"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, PlusSquare, LogOut, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/feed", label: "피드", icon: Home },
  { href: "/map", label: "지도", icon: Map },
  { href: "/write", label: "글쓰기", icon: PlusSquare },
  { href: "/profile", label: "프로필", icon: User },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-100 bg-white/90 backdrop-blur-sm md:static md:border-0 md:bg-transparent md:backdrop-blur-none">
      <div className="mx-auto flex max-w-screen-sm items-center justify-around px-4 py-2 md:flex-col md:gap-1 md:py-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-xs font-medium transition-colors md:flex-row md:gap-2 md:w-full md:text-sm",
              pathname.startsWith(href)
                ? "text-amber-600 bg-amber-50"
                : "text-stone-500 hover:text-amber-600 hover:bg-amber-50"
            )}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-xs font-medium text-stone-500 transition-colors hover:text-red-500 hover:bg-red-50 md:flex-row md:gap-2 md:w-full md:text-sm"
        >
          <LogOut size={20} />
          <span>로그아웃</span>
        </button>
      </div>
    </nav>
  );
}
