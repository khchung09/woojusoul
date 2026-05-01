import { createClient } from "@/lib/supabase/server";
import type { PostWithAuthor } from "@/types/models";
import SearchClient from "./SearchClient";

type PostTypeKey = "all" | "general" | "report" | "temp_protect" | "adoption";
type Mode = "posts" | "neighborhood" | "users";

export type UserResult = {
  id: string;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
};

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
  const rawMode = params.mode as string;
  const mode: Mode = rawMode === "neighborhood" ? "neighborhood"
    : rawMode === "users" ? "users"
    : "posts";

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

  // post_id 단위로 현재 유저의 위치 열람 신청 상태 조회 (Client Component에 plain object로 전달)
  const { data: locRequestsData } = user
    ? await supabase
        .from("location_requests")
        .select("post_id, status")
        .eq("requester_id", user.id)
    : { data: null };
  const locRequestRecord: Record<string, "pending" | "approved" | "rejected"> = Object.fromEntries(
    (locRequestsData ?? []).map((r) => [r.post_id, r.status as "pending" | "approved" | "rejected"])
  );

  let posts: PostWithAuthor[] = [];
  let users: UserResult[] = [];

  if (q) {
    if (mode === "users") {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, is_verified")
        .ilike("username", `%${q}%`)
        .order("username", { ascending: true })
        .limit(30);
      users = (data as UserResult[]) ?? [];
    } else if (mode === "neighborhood") {
      const { data } = await supabase
        .from("posts")
        .select(`*, profiles(username, avatar_url, is_blinded)`)
        .eq("post_type", "report")
        .ilike("location_address", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(30);
      posts = (data as PostWithAuthor[]) ?? [];
    } else {
      let query = supabase
        .from("posts")
        .select(`*, profiles(username, avatar_url, is_blinded)`)
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
      users={users}
      isVerified={isVerified}
      currentUserId={user?.id ?? null}
      likedPostIds={likedPostIds}
      locRequestRecord={locRequestRecord}
    />
  );
}
