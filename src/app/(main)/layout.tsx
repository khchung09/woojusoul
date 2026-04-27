import { Navbar } from "@/components/Navbar";
import Image from "next/image";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 md:flex-row">
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-stone-100 md:bg-white md:px-4 md:py-6">
        <div className="mb-8 flex items-center gap-2 px-2">
          <Image
              src="/woojusoulicon.png"
              alt="우주소울"
              width={44}
              height={44}
              style={{ mixBlendMode: "multiply" }}
            />
          <span className="text-xl font-bold text-amber-600 whitespace-nowrap">우주소울</span>
        </div>
        <Navbar />
      </aside>

      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-screen-sm px-4 py-6">{children}</div>
      </main>

      <div className="md:hidden">
        <Navbar />
      </div>
    </div>
  );
}
