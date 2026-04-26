import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Pet = Database["public"]["Tables"]["pets"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Like = Database["public"]["Tables"]["likes"]["Row"];

export type PostWithAuthor = Post & {
  profiles: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
};

export type ReportPost = PostWithAuthor & {
  latitude: number;
  longitude: number;
};

export type CommentWithAuthor = Comment & {
  profiles: Pick<Profile, "username" | "display_name" | "avatar_url"> | null;
};

