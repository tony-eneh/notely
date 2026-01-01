"use client";

import { useState, useEffect, useCallback } from "react";
import { Note } from "@/types";

export function useNotes(initialFilter?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotes = useCallback(async (filter?: string, query?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter) params.set("filter", filter);
      if (query) params.set("q", query);

      const response = await fetch(`/api/notes?${params}`);
      if (!response.ok) throw new Error("Failed to fetch notes");

      const data = await response.json();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes(initialFilter);
  }, [initialFilter, fetchNotes]);

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
    if (note) {
      await updateNote(id, { isArchived: !note.isArchived });
    }
  };

  return {
    notes,
    isLoading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    toggleFavorite,
    archiveNote,
  };
}
