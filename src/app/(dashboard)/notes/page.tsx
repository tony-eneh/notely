"use client";

import { useSearchParams } from "next/navigation";
import { Plus, Star, Archive, FileText } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";

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
    if (query) return `Search Results`;
    if (filter === "favorites") return "Favorites";
    if (filter === "archive") return "Archive";
    return "All Notes";
  };

  const getIcon = () => {
    if (filter === "favorites") return Star;
    if (filter === "archive") return Archive;
    return FileText;
  };

  const Icon = getIcon();

  return (
    <div className="container py-8 max-w-6xl">
      {/* Page Header */}
      <motion.div 
        className="flex items-start justify-between mb-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
              {getTitle()}
            </h1>
          </div>
          {query ? (
            <p className="text-muted-foreground ml-[52px]">
              Showing results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <p className="text-muted-foreground ml-[52px]">
              {isLoading
                ? "Loading your notes..."
                : `${notes.length} ${notes.length === 1 ? "note" : "notes"} in your collection`}
            </p>
          )}
        </div>
        <Button asChild className="btn-shine gap-2 shadow-md shadow-primary/20">
          <Link href="/notes/new">
            <Plus className="h-4 w-4" />
            New Note
          </Link>
        </Button>
      </motion.div>

      {/* Notes Grid */}
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
