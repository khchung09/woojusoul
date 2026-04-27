import { createClient } from "@/lib/supabase/server";
import type { PostWithAuthor } from "@/types/models";
import SearchClient from "./SearchClient";

type PostTypeKey = "all" | "general" | "report" | "temp_protect" | "adoption";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = ((params.q as string) ?? "").trim();
  const rawType = (params.type as string) ?? "all";
  const postType: PostTypeKey = ["general", "report", "temp_protect", "adoption"].includes(rawType)
    ? (rawType as PostTypeKey)
    : "all";
  const mode = params.mode === "neighborhood" ? "neighborhood" : "posts";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("is_verified").eq("id", user.id).single()
    : { data: null };

  const isVerified = profile?.is_verified ?? false;

  const { data: likesData } = user
    ? await supabase.from("likes").select("post_id").eq("user_id", user.id)
    : { data: null };
  const likedPostIds = likesData?.map((l) => l.post_id) ?? [];

  let posts: PostWithAuthor[] = [];

  if (q) {
    if (mode === "neighborhood") {
      const { data } = await supabase
        .from("posts")
        .select(`*, profiles(username, display_name, avatar_url)`)
        .eq("post_type", "report")
        .ilike("location_address", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(30);
      posts = (data as PostWithAuthor[]) ?? [];
    } else {
      let query = supabase
        .from("posts")
        .select(`*, profiles(username, display_name, avatar_url)`)
        .ilike("content", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(30);

      if (postType !== "all") {
        query = query.eq(
          "post_type",
          postType as "general" | "report" | "temp_protect" | "adoption"
        );
      }

      const { data } = await query;
      posts = (data as PostWithAuthor[]) ?? [];
    }
  }

  return (
    <SearchClient
      initialQ={q}
      initialType={postType}
      initialMode={mode}
      posts={posts}
      isVerified={isVerified}
      currentUserId={user?.id ?? null}
      likedPostIds={likedPostIds}
    />
  );
}
