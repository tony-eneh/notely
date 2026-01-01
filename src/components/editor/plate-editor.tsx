"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plate, PlateContent, usePlateEditor } from "@udecode/plate/react";
import { cn } from "@/lib/utils";
import { editorPlugins } from "./plugins";
import { EditorToolbar } from "./toolbar";

export interface PlateEditorProps {
  initialValue?: unknown[];
  onChange?: (value: unknown[]) => void;
  onSave?: () => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  onAiSummarize?: () => void;
  onAiComplete?: () => void;
  isSummarizing?: boolean;
}

const defaultInitialValue = [
  {
    type: "p",
    children: [{ text: "" }],
  },
];

export function PlateEditor({
  initialValue,
  onChange,
  onSave,
  placeholder = "Start writing...",
  className,
  readOnly = false,
  onAiSummarize,
  onAiComplete,
  isSummarizing,
}: PlateEditorProps) {
  const editor = usePlateEditor({
    plugins: editorPlugins,
    value: (initialValue as any) || defaultInitialValue,
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save on Ctrl/Cmd + S
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSave?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSave]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Plate
        editor={editor}
        onChange={({ value }) => onChange?.(value)}
      >
        {!readOnly && (
          <EditorToolbar
            onAiSummarize={onAiSummarize}
            onAiComplete={onAiComplete}
            isSummarizing={isSummarizing}
          />
        )}
        <PlateContent
          className={cn(
            "min-h-[500px] w-full rounded-lg border bg-background p-6 focus:outline-none",
            "prose prose-slate dark:prose-invert max-w-none",
            "prose-headings:font-semibold prose-headings:tracking-tight",
            "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
            "prose-p:leading-7",
            "prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:pl-4 prose-blockquote:italic",
            "prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-sm",
            "prose-pre:rounded-lg prose-pre:bg-slate-900 prose-pre:p-4",
            "[&_*[data-slate-placeholder=true]]:!opacity-30",
            readOnly && "border-none bg-transparent p-0"
          )}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </Plate>
    </div>
  );
}
