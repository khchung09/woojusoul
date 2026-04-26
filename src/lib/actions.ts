"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function parseImageUrls(imageUrl: string | null): string[] {
  if (!imageUrl) return [];
  if (imageUrl.startsWith("[")) {
    try {
      return JSON.parse(imageUrl) as string[];
    } catch {
      return [imageUrl];
    }
  }
  return [imageUrl];
}

function extractStoragePath(url: string, bucket: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function toggleLike(postId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const { data: existing } = await supabase
    .from("likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: post } = await supabase
    .from("posts")
    .select("likes_count")
    .eq("id", postId)
    .single();

  if (existing) {
    await supabase.from("likes").delete().eq("id", existing.id);
    if (post) {
      await supabase
        .from("posts")
        .update({ likes_count: Math.max(0, post.likes_count - 1) })
        .eq("id", postId);
    }
  } else {
    await supabase.from("likes").insert({ post_id: postId, user_id: user.id });
    if (post) {
      await supabase
        .from("posts")
        .update({ likes_count: post.likes_count + 1 })
        .eq("id", postId);
    }
  }

  revalidatePath("/feed");
  revalidatePath("/profile");
  revalidatePath(`/posts/${postId}`);
}

export async function addComment(postId: string, content: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    content: content.trim(),
  });

  const { data: post } = await supabase
    .from("posts")
    .select("comments_count")
    .eq("id", postId)
    .single();
  if (post) {
    await supabase
      .from("posts")
      .update({ comments_count: post.comments_count + 1 })
      .eq("id", postId);
  }

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/feed");
  revalidatePath("/profile");
}

export async function deleteComment(commentId: string, postId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  await supabase
    .from("comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);

  const { data: post } = await supabase
    .from("posts")
    .select("comments_count")
    .eq("id", postId)
    .single();
  if (post) {
    await supabase
      .from("posts")
      .update({ comments_count: Math.max(0, post.comments_count - 1) })
      .eq("id", postId);
  }

  revalidatePath(`/posts/${postId}`);
  revalidatePath("/feed");
  revalidatePath("/profile");
}

export async function updatePost(
  postId: string,
  updates: {
    content: string;
    image_url: string | null;
    post_type: "general" | "report" | "temp_protect" | "adoption";
    location: string | null;
    location_address: string | null;
    latitude: number | null;
    longitude: number | null;
    animal_type: "cat" | "dog" | "other" | null;
    animal_status: "rescue_needed" | "protected" | "rescued" | null;
  },
  removedImageUrls: string[]
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  if (removedImageUrls.length > 0) {
    const paths = removedImageUrls
      .map((url) => extractStoragePath(url, "posts"))
      .filter((p): p is string => p !== null);
    if (paths.length > 0) {
      await supabase.storage.from("posts").remove(paths);
    }
  }

  const { error } = await supabase
    .from("posts")
    .update(updates)
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/feed");
  revalidatePath("/profile");
}

export async function deletePost(postId: string, imageUrl: string | null): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  // 이미지 Storage 삭제
  const urls = parseImageUrls(imageUrl);
  const paths = urls
    .map((url) => extractStoragePath(url, "posts"))
    .filter((p): p is string => p !== null);

  if (paths.length > 0) {
    await supabase.storage.from("posts").remove(paths);
  }

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/feed");
  revalidatePath("/profile");
}
