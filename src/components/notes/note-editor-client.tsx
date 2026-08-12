"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Loader2,
  Mic,
  Sparkles,
  Wand2,
  FileText,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import debounce from "lodash.debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Note } from "@/types";
import { VoiceNoteRecorder, AudioPlayer } from "@/components/notes";

// Plate's NodeIdPlugin stamps random ids onto nodes, so a server render never
// matches the client one and React throws away the whole tree on hydration.
// The editor is interactive-only anyway (it also drags in react-dnd), so load
// it on the client and skip the mismatch entirely.
const PlateEditor = dynamic(
  () => import("@/components/editor").then((m) => m.PlateEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[calc(100vh-20rem)] w-full animate-pulse space-y-3 pt-2">
        <div className="h-4 w-3/4 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-5/6 rounded bg-muted" />
      </div>
    ),
  }
);

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
  const [isCompleting, setIsCompleting] = useState(false);
  const [summary, setSummary] = useState(note?.summary || "");
  // Plate seeds its value once on mount, so content inserted programmatically
  // (AI continuation, voice transcription) needs a remount to become visible.
  const [editorVersion, setEditorVersion] = useState(0);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [audioUrl, setAudioUrl] = useState(note?.audioUrl || "");
  const [audioSize, setAudioSize] = useState(note?.audioSize || undefined);
  const [audioDuration, setAudioDuration] = useState(note?.audioDuration || undefined);
  const [transcriptionStatus, setTranscriptionStatus] = useState(note?.transcriptionStatus || "none");
  // Both start at the server-rendered value and are corrected in an effect;
  // reading navigator/localStorage during render would desync hydration.
  const [isOnline, setIsOnline] = useState(true);
  const [queuedSync, setQueuedSync] = useState(false);
  const offlineQueuedRef = useRef(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    setQueuedSync(localStorage.getItem("notely-sync-queued") === "1");
  }, []);

  // Escape closes the voice recorder overlay.
  useEffect(() => {
    if (!showVoiceRecorder) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowVoiceRecorder(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showVoiceRecorder]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);

      if (offlineQueuedRef.current || queuedSync) {
        setQueuedSync(true);
        toast({
          title: "Back online",
          description: "Syncing queued changes now.",
        });

        // Clear queued badge after a short delay; the SW handles actual replay.
        setTimeout(() => {
          setQueuedSync(false);
          if (typeof window !== "undefined") {
            localStorage.removeItem("notely-sync-queued");
          }
        }, 4000);
      }

      offlineQueuedRef.current = false;
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast, queuedSync]);

  // Auto-save debounced
  const debouncedSave = useCallback(
    debounce(async (id: string | undefined, data: { title: string; content: unknown[] }) => {
      if (!id) return;

      try {
        const response = await fetch(`/api/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        setHasChanges(false);

        // The service worker parks writes it could not deliver and answers
        // 202, so a successful fetch does not always mean a saved note.
        if (response.status === 202 && !offlineQueuedRef.current) {
          offlineQueuedRef.current = true;
          setQueuedSync(true);
          localStorage.setItem("notely-sync-queued", "1");
          toast({
            title: "Offline",
            description: "Changes queued and will sync when you're back online.",
          });
        }
      } catch (error) {
        if (!navigator.onLine && !offlineQueuedRef.current) {
          offlineQueuedRef.current = true;
          setQueuedSync(true);
          if (typeof window !== "undefined") {
            localStorage.setItem("notely-sync-queued", "1");
          }
          setHasChanges(false);
          toast({
            title: "Offline",
            description: "Changes queued and will sync when you're back online.",
          });
        } else {
          console.error("Auto-save failed:", error);
        }
      }
    }, 1000),
    [toast]
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
        if (!isOnline) {
          toast({
            title: "Offline",
            description: "Go online to create a new note.",
            variant: "destructive",
          });
          return;
        }
        // Create new note
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title: title || "Untitled", 
            content,
            audioUrl,
            audioSize,
            audioDuration,
            transcriptionStatus,
          }),
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
          body: JSON.stringify({ 
            title, 
            content,
            audioUrl,
            audioSize,
            audioDuration,
            transcriptionStatus,
          }),
        });

        if (!response.ok) throw new Error("Failed to save note");

        if (response.status === 202) {
          offlineQueuedRef.current = true;
          setQueuedSync(true);
          localStorage.setItem("notely-sync-queued", "1");
          toast({
            title: "Offline",
            description: "Changes queued and will sync when you're back online.",
          });
        } else {
          toast({
            title: "Note saved",
            description: "Your changes have been saved.",
          });
        }
      }

      setHasChanges(false);
    } catch {
      if (!navigator.onLine) {
        offlineQueuedRef.current = true;
        setQueuedSync(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("notely-sync-queued", "1");
        }
        setHasChanges(false);
        toast({
          title: "Offline",
          description: "Changes queued and will sync when you're back online.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save note. Please try again.",
          variant: "destructive",
        });
      }
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

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summary.");
      }

      setSummary(data.summary);

      toast({
        title: "Summary generated",
        description: "AI has summarized your note.",
      });
    } catch (error) {
      toast({
        title: "Couldn't summarize",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  // Appends blocks to the document and forces the editor to pick them up.
  const appendBlocks = (text: string) => {
    const blocks = text
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => ({ type: "p", children: [{ text: paragraph }] }));

    if (!blocks.length) return;

    setContent((prev) => [...prev, ...blocks]);
    setEditorVersion((v) => v + 1);
    setHasChanges(true);
  };

  const handleAiComplete = async () => {
    if (isCompleting) return;

    setIsCompleting(true);

    try {
      const response = await fetch("/api/ai/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to continue writing.");
      }
      if (!data.completion?.trim()) {
        throw new Error("The AI returned an empty continuation.");
      }

      appendBlocks(data.completion);

      toast({
        title: "Continued writing",
        description: "AI added a continuation to your note.",
      });
    } catch (error) {
      toast({
        title: "Couldn't continue writing",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleTranscriptionComplete = (data: {
    transcription: string;
    audioUrl: string;
    audioSize: number;
    audioDuration: number;
  }) => {
    // Update state with audio data
    setAudioUrl(data.audioUrl);
    setAudioSize(data.audioSize);
    setAudioDuration(data.audioDuration);
    setTranscriptionStatus("completed");
    
    // Add transcription to content (remounts the editor so it shows up)
    appendBlocks(data.transcription);

    // Close recorder
    setShowVoiceRecorder(false);
    
    toast({
      title: "Voice note added",
      description: "Your recording has been transcribed and added to the note.",
    });
  };

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Minimal top bar - Notion style */}
      {/* sticky, not fixed: a fixed bar is positioned against the viewport and
          so runs underneath the sidebar instead of sitting inside the inset. */}
      <div className="sticky top-0 z-40 h-12 flex items-center justify-between gap-2 px-4 sm:px-6 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/notes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
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
          {hasChanges && (
            <span className="text-xs text-muted-foreground">Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-indigo-600 hover:text-indigo-700"
                disabled={isCompleting || isSummarizing}
              >
                {isCompleting || isSummarizing ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-3 w-3" />
                )}
                <span className="hidden sm:inline">AI</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleAiComplete} disabled={isCompleting}>
                <Wand2 className="mr-2 h-4 w-4" />
                {isCompleting ? "Writing..." : "Continue writing"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAiSummarize} disabled={isSummarizing}>
                <FileText className="mr-2 h-4 w-4" />
                {isSummarizing ? "Summarizing..." : "Summarize note"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => setShowVoiceRecorder(true)}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <Mic className="mr-2 h-3 w-3" />
            <span className="hidden sm:inline">Voice Note</span>
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            size="sm"
            className="h-8"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save className="mr-2 h-3 w-3" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Voice Note Recorder Modal */}
      {showVoiceRecorder && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Voice note recorder"
          onClick={() => setShowVoiceRecorder(false)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <VoiceNoteRecorder
              onTranscriptionComplete={handleTranscriptionComplete}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </div>
        </div>
      )}

      {/* Notion-style editor container */}
      <div>
        <div className="max-w-[900px] mx-auto px-5 py-8 sm:px-12 sm:py-12 lg:px-24 lg:py-16">
          {/* Title - Notion style. The size override has to be md:, not sm:,
              because the Input primitive ends its own class list with
              md:text-sm, which otherwise wins the cascade on every desktop
              viewport and renders the title at 14px. */}
          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="text-3xl md:text-[2.5em] font-bold border-none shadow-none px-0 mb-2 focus-visible:ring-0 placeholder:text-muted-foreground/30 bg-transparent h-auto py-1 leading-tight"
          />

          {/* Summary (if exists) */}
          {summary && (
            <div className="mb-4 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 p-4 border border-indigo-200 dark:border-indigo-800">
              <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
                AI Summary
              </h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">{summary}</p>
            </div>
          )}

          {/* Audio Player (if note has audio) */}
          {audioUrl && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Voice Note</span>
              </div>
              <AudioPlayer audioUrl={audioUrl} duration={audioDuration} />
            </div>
          )}

          {/* Editor */}
          <PlateEditor
            key={editorVersion}
            initialValue={content}
            onChange={handleContentChange}
            onSave={handleSave}
            onAiSummarize={handleAiSummarize}
            onAiComplete={handleAiComplete}
            isSummarizing={isSummarizing}
          />
        </div>
      </div>
    </div>
  );
}
