import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Pet = Database["public"]["Tables"]["pets"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type Like = Database["public"]["Tables"]["likes"]["Row"];

export type PostWithAuthor = Post & {
  profiles: Pick<Profile, "username" | "avatar_url" | "is_blinded"> | null;
};

export type Report = Database["public"]["Tables"]["reports"]["Row"];

export type Application = Database["public"]["Tables"]["applications"]["Row"];

export type ApplicationWithApplicant = Application & {
  applicant: Pick<Profile, "username" | "avatar_url"> | null;
};

export type ReportPost = PostWithAuthor & {
  latitude: number;
  longitude: number;
};

export type CommentWithAuthor = Comment & {
  profiles: Pick<Profile, "username" | "avatar_url"> | null;
};

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export type NotificationWithActor = Notification & {
  actor: Pick<Profile, "username" | "avatar_url"> | null;
  post: Pick<Post, "id" | "content" | "post_type"> | null;
};

export type LocationRequest = Database["public"]["Tables"]["location_requests"]["Row"];

