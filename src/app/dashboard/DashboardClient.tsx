"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";

interface Note {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function DashboardClient({ userId }: { userId: string }) {
  const { user } = useUser();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotes() {
      try {
        const res = await fetch("/api/notes");
        if (res.ok) {
          const data = await res.json();
          setNotes(data.notes || []);
        }
      } catch (err) {
        console.error("Failed to fetch notes:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNotes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <span className="font-bold text-xl">ScribeAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/record"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              New Recording
            </Link>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">
          Welcome{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-xl font-semibold mb-2">No notes yet</h2>
            <p className="text-gray-500 mb-6">
              Record your first patient consultation to generate a SOAP note.
            </p>
            <Link
              href="/record"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Start Recording
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition"
              >
                <h3 className="font-semibold text-lg mb-1">{note.title}</h3>
                <p className="text-sm text-gray-500">
                  Created: {new Date(note.created_at).toLocaleDateString()} — Updated:{" "}
                  {new Date(note.updated_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
