"use client";

import { AnimatePresence } from "motion/react";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

import { Note } from "@/types";
import { NoteCard } from "./note-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface NoteListProps {
  notes: Note[];
  isLoading?: boolean;
  onFavorite?: (id: string, isFavorite: boolean) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NoteList({
  notes,
  isLoading,
  onFavorite,
  onArchive,
  onDelete,
}: NoteListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-12 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No notes yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first note to get started
        </p>
        <Button asChild>
          <Link href="/notes/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Note
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence>
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onFavorite={onFavorite}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
