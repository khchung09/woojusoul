import { Navbar } from "@/components/Navbar";
import { WoojuSoulLogo } from "@/components/ui/Logo";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 md:flex-row">
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-stone-100 md:bg-white md:px-4 md:py-6">
        <div className="mb-8 flex items-center gap-3 px-2">
          <WoojuSoulLogo size={36} />
          <span className="text-xl font-bold text-amber-600">우주소울</span>
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
