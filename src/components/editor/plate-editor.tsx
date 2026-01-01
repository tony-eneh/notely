"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plate, PlateContent, usePlateEditor } from "@udecode/plate/react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { cn } from "@/lib/utils";
import { editorPlugins } from "./plugins";
import { FloatingToolbar } from "./floating-toolbar";
import { SlashCommandMenu } from "./slash-command-menu";

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
  placeholder = "Type '/' for commands, or just start writing...",
  className,
  readOnly = false,
  onAiSummarize,
  onAiComplete,
  isSummarizing,
}: PlateEditorProps) {
  const editor = usePlateEditor({
    plugins: editorPlugins as any,
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
    <DndProvider backend={HTML5Backend}>
      <div className={cn("flex flex-col gap-4 w-full", className)} id="plate-editor-container">
        <Plate
          editor={editor}
          onChange={({ value }) => onChange?.(value)}
        >
          {!readOnly && (
            <>
              <FloatingToolbar />
              <SlashCommandMenu />
            </>
          )}
          
          <PlateContent
            className={cn(
              "notion-editor",
              "min-h-[calc(100vh-20rem)] w-full",
              "focus:outline-none",
              "text-[16px] leading-[1.6]",
              readOnly && "min-h-0"
            )}
            placeholder={placeholder}
            readOnly={readOnly}
          />
        </Plate>
      </div>
    </DndProvider>
  );
}
