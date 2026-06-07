import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdminSingleton } from "@/lib/supabase";

function getSB() {
  const sb = getSupabaseAdminSingleton();
  if (!sb) throw new Error("Database not configured");
  return sb;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getSB();
    const { data: note, error } = await sb
      .from("notes")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch note" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getSB();
    const body = await request.json();
    const { title, soap_note, transcript } = body;

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (soap_note !== undefined) updateData.soap_note = soap_note;
    if (transcript !== undefined) updateData.transcript = transcript;

    const { data: note, error } = await sb
      .from("notes")
      .update(updateData)
      .eq("id", params.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getSB();
    const { error } = await sb
      .from("notes")
      .delete()
      .eq("id", params.id)
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete note" },
      { status: 500 }
    );
  }
}
