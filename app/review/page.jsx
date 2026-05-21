"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function ReviewNotesPage() {
  const { data: session, status } = useSession();

  const [wordNotes, setWordNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const [editingNoteId, setEditingNoteId] = useState(null);
  const [draftNote, setDraftNote] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editMessage, setEditMessage] = useState(null);

  const loadWordNotes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/word-notes");

      if (response.status === 401) {
        setError("Sign in to view your saved word notes.");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load word notes");
      }

      const data = await response.json();
      setWordNotes(data.wordNotes ?? []);
    } catch (error) {
      setError("Could not load word notes.");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditingNote = (wordNote) => {
    setEditingNoteId(wordNote.id);
    setDraftNote(wordNote.note);
    setEditMessage(null);
  };
  
  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setDraftNote("");
    setEditMessage(null);
  };
  
  const saveEditedNote = async (wordNote) => {
    if (!draftNote.trim()) {
      setEditMessage("Note cannot be empty.");
      return;
    }
  
    setIsSavingEdit(true);
    setEditMessage(null);
  
    try {
      const response = await fetch("/api/word-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lemma: wordNote.lemma,
          surface: wordNote.surface,
          note: draftNote,
        }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update note");
      }
  
      const data = await response.json();
  
      setWordNotes((notes) =>
        notes.map((note) =>
          note.id === wordNote.id ? data.wordNote : note
        )
      );
  
      setEditingNoteId(null);
      setDraftNote("");
      setEditMessage("Note updated.");
    } catch (error) {
      setEditMessage("Could not update note.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      loadWordNotes();
    }
  }, [status]);

  const filteredNotes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return wordNotes;

    return wordNotes.filter((note) => {
      return (
        note.lemma?.toLowerCase().includes(query) ||
        note.surface?.toLowerCase().includes(query) ||
        note.note?.toLowerCase().includes(query)
      );
    });
  }, [wordNotes, search]);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-[#f7f4ee] px-5 py-6 text-stone-900">
        <div className="mx-auto max-w-4xl">
          <p className="text-stone-600">Checking sign-in...</p>
        </div>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] px-5 py-6 text-stone-900">
        <div className="mx-auto max-w-4xl rounded-sm border border-stone-300 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Review Notes</h1>
          <p className="mt-2 text-stone-600">
            Sign in to review your saved Ancient Greek word notes.
          </p>

          <div className="mt-4 flex gap-3">
            <Button onClick={() => signIn("github")} className="rounded-sm">
              Sign in with GitHub
            </Button>

            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-sm border border-stone-300 bg-white px-4 text-sm hover:border-stone-600"
            >
              Back to reader
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-6 text-stone-900">
      <div className="mx-auto max-w-4xl">
        <header className="mb-5 border-b border-stone-300 pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Review Notes
              </h1>
              <p className="mt-1 text-sm text-stone-600">
                Review your saved lemma-level Ancient Greek vocabulary notes.
              </p>
            </div>

            <Link
              href="/"
              className="inline-flex h-8 items-center rounded-sm border border-stone-300 bg-white px-3 text-sm hover:border-stone-600"
            >
              Back to reader
            </Link>
          </div>
        </header>

        <section className="mb-5 rounded-sm border border-stone-300 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search lemma, surface, or note..."
              className="h-9 flex-1 rounded-sm border border-stone-300 bg-white px-3 text-sm outline-none focus:border-stone-500"
            />

            <Button
              onClick={loadWordNotes}
              disabled={isLoading}
              variant="outline"
              className="h-9 rounded-sm px-3"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          {editMessage && (
            <p className="mt-3 text-sm text-stone-600">{editMessage}</p>
          )}

          <p className="mt-3 text-sm text-stone-500">
            {filteredNotes.length} note{filteredNotes.length === 1 ? "" : "s"} shown
          </p>
        </section>

        <section className="space-y-3">
          {isLoading ? (
            <div className="rounded-sm border border-stone-300 bg-white p-4 text-sm italic text-stone-500 shadow-sm">
              Loading notes...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="rounded-sm border border-stone-300 bg-white p-4 text-sm text-stone-500 shadow-sm">
              No notes found. Go back to the reader, click a parsed word, and save a note.
            </div>
          ) : (
            filteredNotes.map((wordNote) => (
              <article
                key={wordNote.id}
                className="rounded-sm border border-stone-300 bg-white p-4 shadow-sm"
              >
                <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-stone-200 pb-3">
                  <h2 className="font-serif text-3xl font-semibold">
                    {wordNote.lemma}
                  </h2>

                  {wordNote.surface && (
                    <span className="text-sm text-stone-500">
                      seen as{" "}
                      <span className="font-serif text-base text-stone-700">
                        {wordNote.surface}
                      </span>
                    </span>
                  )}
                </div>

                {editingNoteId === wordNote.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={draftNote}
                      onChange={(event) => setDraftNote(event.target.value)}
                      className="min-h-28 w-full resize-y rounded-sm border border-stone-300 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-stone-500"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => saveEditedNote(wordNote)}
                        disabled={isSavingEdit}
                        className="h-8 rounded-sm px-3"
                      >
                        {isSavingEdit ? "Saving..." : "Save Changes"}
                      </Button>

                      <Button
                        type="button"
                        onClick={cancelEditingNote}
                        disabled={isSavingEdit}
                        variant="outline"
                        className="h-8 rounded-sm px-3"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
                      {wordNote.note}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-stone-400">
                        Updated {new Date(wordNote.updatedAt).toLocaleDateString()}
                      </p>

                      <Button
                        type="button"
                        onClick={() => startEditingNote(wordNote)}
                        variant="outline"
                        className="h-8 rounded-sm px-3"
                      >
                        Edit
                      </Button>
                    </div>
                  </>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}