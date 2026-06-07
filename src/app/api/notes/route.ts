import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: notes, error } = await supabaseAdmin
      .from("notes")
      .select("id, title, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ notes: notes || [] });
  } catch (error: any) {
    console.error("Failed to fetch notes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, transcript, soap_note } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const { data: note, error } = await supabaseAdmin
      .from("notes")
      .insert({
        user_id: userId,
        title,
        transcript: transcript || "",
        soap_note: soap_note || "",
        status: soap_note ? "completed" : "draft",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ note });
  } catch (error: any) {
    console.error("Failed to create note:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create note" },
      { status: 500 }
    );
  }
}