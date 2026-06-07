"use client";

import { useState } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface NoteData {
  id: string;
  title: string;
  transcript: string;
  soap_note: string;
  created_at: string;
  updated_at: string;
}

export default function NoteDetailClient({ note }: { note: NoteData }) {
  const router = useRouter();
  const [soapContent, setSoapContent] = useState(note.soap_note);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ soap_note: soapContent }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const res = await fetch(`/api/notes/${note.id}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${note.title.replace(/\s+/g, "_")}_SOAP_Note.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Failed to download PDF:", err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(soapContent);
    alert("SOAP note copied to clipboard!");
  };

  const renderSOAP = (text: string) => {
    const sections = text.split(/(?=Subjective:|Objective:|Assessment:|Plan:)/g);
    return sections.map((section, i) => {
      const header = section.match(/^(Subjective|Objective|Assessment|Plan):/);
      if (header) {
        const colorMap: Record<string, string> = {
          Subjective: "text-blue-600",
          Objective: "text-green-600",
          Assessment: "text-orange-600",
          Plan: "text-purple-600",
        };
        return (
          <div key={i} className="mb-4">
            <h3 className={`font-bold ${colorMap[header[1]] || "text-gray-800"} mb-1`}>
              {header[1]}
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{section.replace(header[0], "")}</p>
          </div>
        );
      }
      return <p key={i} className="text-gray-700 whitespace-pre-wrap">{section}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : saved ? "Saved!" : "Save"}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Download PDF
            </button>
            <button
              onClick={handleCopy}
              className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
            >
              Copy
            </button>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{note.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Created: {new Date(note.created_at).toLocaleDateString()} — Last updated:{" "}
            {new Date(note.updated_at).toLocaleDateString()}
          </p>
        </div>

        {/* SOAP Note Editor */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
          <h2 className="font-semibold text-lg mb-4">SOAP Note</h2>
          <textarea
            value={soapContent}
            onChange={(e) => {
              setSoapContent(e.target.value);
              setSaved(false);
            }}
            className="w-full min-h-[400px] p-4 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        {/* Transcript (read-only) */}
        {note.transcript && (
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h2 className="font-semibold text-lg mb-3">Original Transcript</h2>
            <p className="text-gray-600 text-sm whitespace-pre-wrap">{note.transcript}</p>
          </div>
        )}
      </main>
    </div>
  );
}