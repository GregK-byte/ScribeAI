import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { anthropic, SOAP_SYSTEM_PROMPT } from "@/lib/anthropic";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transcript, noteId, title } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    // Generate SOAP note with Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SOAP_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Please format the following doctor-patient consultation transcript into a structured SOAP note:\n\n${transcript}`,
        },
      ],
    });

    const soapNote = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("\n");

    // Update the note in Supabase
    if (noteId) {
      const { error } = await supabaseAdmin
        .from("notes")
        .update({
          soap_note: soapNote,
          title: title || `Consultation - ${new Date().toLocaleDateString()}`,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", noteId)
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to update note:", error);
      }
    }

    return NextResponse.json({
      soapNote,
      noteId: noteId || null,
    });
  } catch (error: any) {
    console.error("Note generation error:", error);
    return NextResponse.json(
      { error: error.message || "Note generation failed" },
      { status: 500 }
    );
  }
}