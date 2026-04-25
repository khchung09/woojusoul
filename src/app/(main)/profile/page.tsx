import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PawPrint, Mail } from "lucide-react";
import type { Profile, Pet } from "@/types/models";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as Profile | null;

  const { data: petsData } = await supabase
    .from("pets")
    .select("*")
    .eq("owner_id", user.id);

  const pets = petsData as Pet[] | null;

  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-2xl font-bold text-amber-600">
            {profile?.display_name?.[0] ?? profile?.username?.[0] ?? "?"}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-stone-900">
              {profile?.display_name ?? profile?.username ?? "사용자"}
            </h1>
            <p className="text-sm text-stone-500">@{profile?.username}</p>
          </div>
        </div>

        {profile?.bio && (
          <p className="mt-4 text-sm text-stone-700 leading-relaxed">{profile.bio}</p>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm text-stone-400">
          <Mail size={14} />
          <span>{user.email}</span>
        </div>

        <div className="mt-4 flex gap-6 border-t border-stone-100 pt-4">
          <div className="text-center">
            <p className="text-lg font-bold text-stone-900">{postCount ?? 0}</p>
            <p className="text-xs text-stone-400">게시물</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-stone-900">{pets?.length ?? 0}</p>
            <p className="text-xs text-stone-400">반려동물</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-base font-bold text-stone-900">내 반려동물</h2>
        {!pets || pets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-10 shadow-sm text-stone-400">
            <PawPrint size={36} className="mb-2 opacity-30" />
            <p className="text-sm">등록된 반려동물이 없어요</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {pets.map((pet) => (
              <div key={pet.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-xl">
                  {pet.species === "dog" ? "🐶" : pet.species === "cat" ? "🐱" : "🐾"}
                </div>
                <p className="font-semibold text-stone-900">{pet.name}</p>
                <p className="text-xs text-stone-400">{pet.breed ?? pet.species}</p>
                {pet.age && <p className="text-xs text-stone-400">{pet.age}살</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
