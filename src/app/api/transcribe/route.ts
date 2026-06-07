import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { openai } from "@/lib/openai";
import { uploadAudioToS3 } from "@/lib/s3";
import { getSupabaseAdminSingleton } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = getSupabaseAdminSingleton();
    if (!sb) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3 (optional - we do it before transcribing for backup)
    try {
      const s3Url = await uploadAudioToS3(buffer, audioFile.name, audioFile.type);
      console.log("Audio uploaded to S3:", s3Url);
    } catch (s3Err) {
      console.warn("S3 upload failed, continuing with transcription:", s3Err);
      // Continue even if S3 upload fails
    }

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: new File([buffer], audioFile.name, { type: audioFile.type }),
      language: "en",
    });

    const transcript = transcription.text;

    // Save transcript to Supabase as a draft note
    const { data: note, error } = await sb
      .from("notes")
      .insert({
        user_id: userId,
        title: `Consultation - ${new Date().toLocaleDateString()}`,
        transcript,
        soap_note: "",
        status: "transcribed",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to save transcript to database:", error);
    }

    return NextResponse.json({
      transcript,
      noteId: note?.id || null,
    });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: error.message || "Transcription failed" },
      { status: 500 }
    );
  }
}