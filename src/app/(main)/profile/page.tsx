import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PawPrint } from "lucide-react";
import type { Profile, Pet, PostWithAuthor } from "@/types/models";
import ProfileEditor from "./ProfileEditor";
import ProfileTabs from "./ProfileTabs";
import PostCard from "@/components/PostCard";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as Profile | null;
  if (!profile) redirect("/login");

  const { data: petsData } = await supabase
    .from("pets")
    .select("*")
    .eq("owner_id", user.id);

  const pets = (petsData ?? []) as Pet[];

  const { data: postsData } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  const posts = (postsData ?? []) as PostWithAuthor[];

  const { data: likesData } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", user.id);
  const likedPostIds = new Set(likesData?.map((l) => l.post_id) ?? []);

  const petsContent =
    pets.length === 0 ? (
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
    );

  const postsContent =
    posts.length === 0 ? (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-10 shadow-sm text-stone-400">
        <PawPrint size={36} className="mb-2 opacity-30" />
        <p className="text-sm">아직 게시물이 없어요</p>
      </div>
    ) : (
      <div className="flex flex-col gap-5">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isVerified={profile.is_verified}
            currentUserId={user.id}
            initialLiked={likedPostIds.has(post.id)}
          />
        ))}
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <ProfileEditor
        profile={profile}
        userEmail={user.email ?? ""}
        postCount={posts.length}
        petCount={pets.length}
      />
      <ProfileTabs petsContent={petsContent} postsContent={postsContent} />
    </div>
  );
}
