"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Mic } from "lucide-react";
import Link from "next/link";
import debounce from "lodash.debounce";

import { PlateEditor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Note } from "@/types";
import { VoiceNoteRecorder, AudioPlayer } from "@/components/notes";

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
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [audioUrl, setAudioUrl] = useState(note?.audioUrl || "");
  const [audioSize, setAudioSize] = useState(note?.audioSize || undefined);
  const [audioDuration, setAudioDuration] = useState(note?.audioDuration || undefined);
  const [transcriptionStatus, setTranscriptionStatus] = useState(note?.transcriptionStatus || "none");
  const [isOnline, setIsOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [queuedSync, setQueuedSync] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("notely-sync-queued") === "1";
  });
  const offlineQueuedRef = useRef(false);

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
        await fetch(`/api/notes/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        setHasChanges(false);
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

        toast({
          title: "Note saved",
          description: "Your changes have been saved.",
        });
      }

      setHasChanges(false);
    } catch (error) {
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
    
    // Add transcription to content
    const transcriptionContent = [
      ...content,
      { type: "p", children: [{ text: data.transcription }] }
    ];
    setContent(transcriptionContent);
    setHasChanges(true);
    
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
      <div className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center justify-between px-6 border-b bg-background/80 backdrop-blur-sm">
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
          <Button 
            onClick={() => setShowVoiceRecorder(true)}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <Mic className="mr-2 h-3 w-3" />
            Voice Note
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
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <VoiceNoteRecorder
              onTranscriptionComplete={handleTranscriptionComplete}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </div>
        </div>
      )}

      {/* Notion-style editor container */}
      <div className="pt-12">
        <div className="max-w-[900px] mx-auto px-24 py-16">
          {/* Title - Notion style */}
          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="text-[2.5em] font-bold border-none shadow-none px-0 mb-2 focus-visible:ring-0 placeholder:text-muted-foreground/30 bg-transparent h-auto py-1"
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
