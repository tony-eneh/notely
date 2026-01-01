"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Star, MoreHorizontal, Trash2, Archive, FolderOpen } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { Note } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NoteCardProps {
  note: Note;
  onFavorite?: (id: string, isFavorite: boolean) => void;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NoteCard({ note, onFavorite, onArchive, onDelete }: NoteCardProps) {
  const preview = note.plainText?.slice(0, 120) || "Start writing...";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Link href={`/notes/${note.id}`}>
        <Card className="card-paper group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-border/50 hover:border-primary/20">
          {/* Accent Line on Hover */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <CardHeader className="pb-3 pt-5 px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {note.isFavorite && (
                    <Star className="h-3.5 w-3.5 fill-primary text-primary flex-shrink-0" />
                  )}
                  <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium">
                    {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold line-clamp-1 text-foreground group-hover:text-primary transition-colors duration-200">
                  {note.title || "Untitled"}
                </h3>
              </div>
              <div onClick={(e) => e.preventDefault()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => onFavorite?.(note.id, !note.isFavorite)}
                      className="gap-2"
                    >
                      <Star className={cn("h-4 w-4", note.isFavorite && "fill-primary text-primary")} />
                      {note.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onArchive?.(note.id)}
                      className="gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      {note.isArchived ? "Unarchive" : "Archive"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(note.id)}
                      className="text-destructive focus:text-destructive gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
              {preview}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {note.folder && (
                <Badge 
                  variant="secondary" 
                  className="text-[10px] font-medium px-2 py-0.5 bg-secondary/50"
                >
                  <FolderOpen className="mr-1 h-3 w-3" />
                  {note.folder.name}
                </Badge>
              )}
              {note.tags?.slice(0, 2).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-[10px] font-medium px-2 py-0.5"
                  style={{ 
                    borderColor: tag.color || 'var(--border)', 
                    color: tag.color || 'var(--muted-foreground)',
                    backgroundColor: tag.color ? `${tag.color}10` : 'transparent'
                  }}
                >
                  {tag.name}
                </Badge>
              ))}
              {note.tags && note.tags.length > 2 && (
                <span className="text-[10px] text-muted-foreground font-medium">
                  +{note.tags.length - 2}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
