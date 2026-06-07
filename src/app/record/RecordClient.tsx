"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function RecordClient({ userId }: { userId: string }) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [soapNote, setSoapNote] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteId, setNoteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processAudio = async (blob: Blob) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("userId", userId);

      const transcribeRes = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!transcribeRes.ok) {
        const errData = await transcribeRes.json();
        throw new Error(errData.error || "Transcription failed");
      }

      const transcribeData = await transcribeRes.json();
      setTranscript(transcribeData.transcript);

      setLoadingAI(true);
      const noteRes = await fetch("/api/generate-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcribeData.transcript,
          userId,
          title: noteTitle || `Consultation - ${new Date().toLocaleDateString()}`,
        }),
      });

      if (!noteRes.ok) {
        const errData = await noteRes.json();
        throw new Error(errData.error || "Note generation failed");
      }

      const noteData = await noteRes.json();
      setSoapNote(noteData.soapNote);
      setNoteId(noteData.noteId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setUploading(false);
      setLoadingAI(false);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied. Please allow microphone permissions or upload an audio file.");
    }
  }, [processAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAudio(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <Link href="/dashboard" className="font-bold text-xl hover:text-blue-600 transition">
              ScribeAI
            </Link>
          </div>
          <UserButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">New Patient Recording</h1>

        <div className="bg-white p-8 rounded-xl border border-gray-200 mb-8">
          <div className="flex flex-col items-center gap-6">
            <div className="w-full max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note Title (optional)
              </label>
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g., Annual Checkup - John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-4">
              {!recording ? (
                <button
                  onClick={startRecording}
                  disabled={uploading || loadingAI}
                  className="flex items-center gap-2 bg-red-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-200"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 bg-gray-800 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-900 transition shadow-lg"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  Stop Recording
                </button>
              )}
            </div>

            {recording && (
              <div className="flex items-center gap-2 text-red-600 animate-pulse">
                <div className="w-3 h-3 bg-red-600 rounded-full" />
                <span className="text-sm font-medium">Recording...</span>
              </div>
            )}

            <div className="w-full flex items-center gap-3 text-gray-400">
              <div className="flex-1 border-t" />
              <span className="text-sm">OR</span>
              <div className="flex-1 border-t" />
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || loadingAI}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50"
              >
                Upload Audio File
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Supports MP3, WAV, M4A, WebM
              </p>
            </div>
          </div>

          {uploading && (
            <div className="mt-6 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-gray-500">Uploading and transcribing audio...</p>
            </div>
          )}
          {loadingAI && (
            <div className="mt-6 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-gray-500">Generating SOAP note with AI...</p>
            </div>
          )}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {(transcript || soapNote) && (
          <div className="grid md:grid-cols-2 gap-6">
            {transcript && (
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Transcript
                </h2>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{transcript}</p>
              </div>
            )}

            {soapNote && (
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h2 className="font-semibold text-lg mb-3 flex items-center gap-2 text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  SOAP Note
                </h2>
                <div className="text-gray-700 text-sm whitespace-pre-wrap font-mono">{soapNote}</div>
                {noteId && (
                  <Link
                    href={`/notes/${noteId}`}
                    className="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View full note &rarr;
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}