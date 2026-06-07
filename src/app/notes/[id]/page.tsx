import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NoteDetailClient from "./NoteDetailClient";
import { getSupabaseAdminSingleton } from "@/lib/supabase";

interface PageProps {
  params: { id: string };
}

export default async function NoteDetailPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const sb = getSupabaseAdminSingleton();
  if (!sb) {
    redirect("/dashboard");
  }

  const { data: note, error } = await sb
    .from("notes")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (error || !note) {
    redirect("/dashboard");
  }

  return <NoteDetailClient note={note} />;
}
