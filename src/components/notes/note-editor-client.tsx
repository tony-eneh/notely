"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import debounce from "lodash.debounce";

import { PlateEditor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Note } from "@/types";

interface NoteEditorClientProps {
  note?: Note;
  isNew?: boolean;
}

export function NoteEditorClient({ note, isNew = false }: NoteEditorClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState<unknown[]>(
    (note?.content as unknown[]) || [{ type: "p", children: [{ text: "" }] }]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [noteId, setNoteId] = useState(note?.id);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState(note?.summary || "");

  // Auto-save debounced
  const debouncedSave = useCallback(
    debounce(async (id: string | undefined, data: { title: string; content: unknown[] }) => {
      if (!id) return;
      
      try {
        await fetch(`/api/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        setHasChanges(false);
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }, 1000),
    []
  );

  // Track changes and auto-save
  useEffect(() => {
    if (hasChanges && noteId) {
      debouncedSave(noteId, { title, content });
    }
  }, [title, content, hasChanges, noteId, debouncedSave]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      if (isNew && !noteId) {
        // Create new note
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title || "Untitled", content }),
        });

        if (!response.ok) throw new Error("Failed to create note");

        const newNote = await response.json();
        setNoteId(newNote.id);
        router.replace(`/notes/${newNote.id}`);

        toast({
          title: "Note created",
          description: "Your note has been saved.",
        });
      } else if (noteId) {
        // Update existing note
        const response = await fetch(`/api/notes/${noteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });

        if (!response.ok) throw new Error("Failed to save note");

        toast({
          title: "Note saved",
          description: "Your changes have been saved.",
        });
      }

      setHasChanges(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasChanges(true);
  };

  const handleContentChange = (value: unknown[]) => {
    setContent(value);
    setHasChanges(true);
  };

  const handleAiSummarize = async () => {
    if (!noteId) {
      toast({
        title: "Save first",
        description: "Please save your note before summarizing.",
        variant: "destructive",
      });
      return;
    }

    setIsSummarizing(true);

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, content }),
      });

      if (!response.ok) throw new Error("Failed to summarize");

      const data = await response.json();
      setSummary(data.summary);

      toast({
        title: "Summary generated",
        description: "AI has summarized your note.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAiComplete = async () => {
    // This will be implemented with streaming
    toast({
      title: "Coming soon",
      description: "AI autocomplete is being implemented.",
    });
  };

  return (
    <div className="container py-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/notes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {hasChanges && <span>Unsaved changes</span>}
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </div>

      {/* Title */}
      <Input
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        className="text-3xl font-bold border-none shadow-none px-0 mb-6 focus-visible:ring-0 placeholder:text-muted-foreground/50"
      />

      {/* Summary (if exists) */}
      {summary && (
        <div className="mb-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-4 border border-indigo-200 dark:border-indigo-800">
          <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
            AI Summary
          </h3>
          <p className="text-sm text-indigo-600 dark:text-indigo-400">{summary}</p>
        </div>
      )}

      {/* Editor */}
      <PlateEditor
        initialValue={content}
        onChange={handleContentChange}
        onSave={handleSave}
        onAiSummarize={handleAiSummarize}
        onAiComplete={handleAiComplete}
        isSummarizing={isSummarizing}
        placeholder="Start writing your note..."
      />
    </div>
  );
}
