"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Feather, Plus } from "lucide-react";
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
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [queuedSync, setQueuedSync] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("notely-sync-queued") === "1";
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Clear queued flag once online; service worker handles replay.
      setQueuedSync(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("notely-sync-queued");
      }
    };
    const handleOffline = () => setIsOnline(false);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "notely-sync-queued") {
        setQueuedSync(event.newValue === "1");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="card-paper rounded-lg border border-border/50 p-5 space-y-3"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-10 w-full" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <motion.div 
        className="flex flex-col items-center justify-center py-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="rounded-2xl bg-primary/5 p-6 mb-6 ring-1 ring-primary/10">
          <Feather className="h-10 w-10 text-primary" />
        </div>
        <h3 className="font-display text-2xl font-semibold mb-2 text-foreground">
          Begin Your Story
        </h3>
        <p className="text-muted-foreground mb-6 max-w-sm leading-relaxed">
          Every great idea starts with a single note. Create your first one and let your thoughts flow.
        </p>
        <Button asChild className="btn-shine gap-2 px-6">
          <Link href="/notes/new">
            <Plus className="h-4 w-4" />
            Create Your First Note
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {(queuedSync || !isOnline) && (
        <div className="flex items-center gap-2 flex-wrap">
          {!isOnline && (
            <span className="text-xs text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5">
              Offline — changes will sync later
            </span>
          )}
          {queuedSync && isOnline && (
            <span className="text-xs text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2 py-0.5">
              Syncing queued changes…
            </span>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {notes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                duration: 0.3, 
                delay: index * 0.05,
                ease: "easeOut"
              }}
            >
              <NoteCard
                note={note}
                onFavorite={onFavorite}
                onArchive={onArchive}
                onDelete={onDelete}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
