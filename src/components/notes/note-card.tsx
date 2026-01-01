"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FileText, Star, MoreHorizontal, Trash2, Archive, FolderOpen } from "lucide-react";
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
  const preview = note.plainText?.slice(0, 150) || "No content";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Link href={`/notes/${note.id}`}>
        <Card className="group relative overflow-hidden transition-all hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold line-clamp-1 group-hover:text-indigo-600 transition-colors">
                  {note.title || "Untitled"}
                </h3>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                {note.isFavorite && (
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onFavorite?.(note.id, !note.isFavorite)}
                    >
                      <Star className={cn("mr-2 h-4 w-4", note.isFavorite && "fill-yellow-400")} />
                      {note.isFavorite ? "Remove from favorites" : "Add to favorites"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onArchive?.(note.id)}>
                      <Archive className="mr-2 h-4 w-4" />
                      {note.isArchived ? "Unarchive" : "Archive"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(note.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {preview}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {note.folder && (
                  <Badge variant="secondary" className="text-xs">
                    <FolderOpen className="mr-1 h-3 w-3" />
                    {note.folder.name}
                  </Badge>
                )}
                {note.tags?.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: tag.color, color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
