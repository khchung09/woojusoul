import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";

export default async function ByUsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (!data) notFound();
  redirect(`/profile/${data.id}`);
}
