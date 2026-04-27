export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          is_verified?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      pets: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          species: string;
          breed: string | null;
          age: number | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          species: string;
          breed?: string | null;
          age?: number | null;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          species?: string;
          breed?: string | null;
          age?: number | null;
          photo_url?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          content: string;
          image_url: string | null;
          post_type: "general" | "report" | "temp_protect" | "adoption";
          location: string | null;
          location_address: string | null;
          latitude: number | null;
          longitude: number | null;
          animal_type: "cat" | "dog" | "other" | null;
          animal_status: "rescue_needed" | "protected" | "rescued" | null;
          likes_count: number;
          comments_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          content: string;
          image_url?: string | null;
          post_type?: "general" | "report" | "temp_protect" | "adoption";
          location?: string | null;
          location_address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          animal_type?: "cat" | "dog" | "other" | null;
          animal_status?: "rescue_needed" | "protected" | "rescued" | null;
          likes_count?: number;
          comments_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          content?: string;
          image_url?: string | null;
          post_type?: "general" | "report" | "temp_protect" | "adoption";
          location?: string | null;
          location_address?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          animal_type?: "cat" | "dog" | "other" | null;
          animal_status?: "rescue_needed" | "protected" | "rescued" | null;
          likes_count?: number;
          comments_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          actor_id: string;
          post_id: string;
          type: "like" | "comment";
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          actor_id: string;
          post_id: string;
          type: "like" | "comment";
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
