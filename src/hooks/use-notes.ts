"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Note } from "@/types";

export interface NotesQuery {
  filter?: string;
  query?: string;
  useAi?: boolean;
  folderId?: string;
}

export function useNotes(options: NotesQuery = {}) {
  const { filter, query, useAi = false, folderId } = options;

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Guards against out-of-order responses when the query changes fast.
  const requestIdRef = useRef(0);

  const fetchNotes = useCallback(async (params: NotesQuery = {}) => {
    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestId === requestIdRef.current;

    setIsLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      // Semantic search goes through the AI endpoint; everything else is a
      // plain filtered/text query against /api/notes.
      if (params.query && params.useAi) {
        const response = await fetch("/api/ai/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: params.query, useAi: true }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Failed to search notes");
        }

        if (!isCurrent()) return;
        setNotes(data.notes ?? []);
        setAiResponse(data.aiResponse || null);
        return;
      }

      const search = new URLSearchParams();
      if (params.filter) search.set("filter", params.filter);
      if (params.query) search.set("q", params.query);
      if (params.folderId) search.set("folderId", params.folderId);

      const response = await fetch(`/api/notes?${search}`);
      if (!response.ok) throw new Error("Failed to fetch notes");

      const data = await response.json();
      if (!isCurrent()) return;
      setNotes(data);
    } catch (err) {
      if (!isCurrent()) return;
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, []);

  // Depends on primitives, not the options object, so a fresh literal from the
  // caller does not retrigger the fetch on every render.
  useEffect(() => {
    fetchNotes({ filter, query, useAi, folderId });
  }, [filter, query, useAi, folderId, fetchNotes]);

  const createNote = async (data: Partial<Note>) => {
    const response = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to create note");
    const newNote = await response.json();
    setNotes((prev) => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = async (id: string, data: Partial<Note>) => {
    const response = await fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to update note");
    const updatedNote = await response.json();
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? updatedNote : note))
    );
    return updatedNote;
  };

  const deleteNote = async (id: string) => {
    const response = await fetch(`/api/notes/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Failed to delete note");
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    await updateNote(id, { isFavorite });
  };

  const archiveNote = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;

    await updateNote(id, { isArchived: !note.isArchived });

    // The archive view lists archived notes and every other view lists
    // unarchived ones, so a toggled note no longer belongs in the current list.
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notes,
    isLoading,
    error,
    aiResponse,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    archiveNote,
  };
}
