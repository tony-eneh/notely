"use client";

import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import Link from "next/link";

import { useNotes } from "@/hooks/use-notes";
import { NoteList } from "@/components/notes";
import { Button } from "@/components/ui/button";

export default function NotesPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") || undefined;
  const query = searchParams.get("q") || undefined;

  const {
    notes,
    isLoading,
    toggleFavorite,
    archiveNote,
    deleteNote,
    fetchNotes,
  } = useNotes(filter);

  // Refetch when search params change
  const handleSearch = () => {
    fetchNotes(filter, query);
  };

  const getTitle = () => {
    if (query) return `Search: "${query}"`;
    if (filter === "favorites") return "Favorites";
    if (filter === "archive") return "Archive";
    return "All Notes";
  };

  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{getTitle()}</h1>
          <p className="text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Button asChild>
          <Link href="/notes/new">
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Link>
        </Button>
      </div>

      <NoteList
        notes={notes}
        isLoading={isLoading}
        onFavorite={toggleFavorite}
        onArchive={archiveNote}
        onDelete={deleteNote}
      />
    </div>
  );
}
