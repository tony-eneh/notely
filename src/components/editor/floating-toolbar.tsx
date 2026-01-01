"use client";

import { useEditorRef, useEditorState } from "@udecode/plate/react";
import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
} from "@udecode/plate-basic-marks/react";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

export function FloatingToolbar() {
  const editor = useEditorRef();
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setShow(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (rect.width === 0 || rect.height === 0) {
        setShow(false);
        return;
      }

      setPosition({
        top: rect.top - 50 + window.scrollY,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
      setShow(true);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const handleToggleMark = (markType: string) => {
    if (!editor) return;
    
    const isActive = editor.marks?.[markType];
    
    if (isActive) {
      editor.tf.removeMark(markType);
    } else {
      editor.tf.addMark(markType, true);
    }
  };

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex items-center gap-1 rounded-lg border bg-popover p-1 shadow-lg",
        "transition-opacity duration-200 animate-in fade-in-0 zoom-in-95",
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: "translateX(-50%)",
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 hover:bg-accent"
        onMouseDown={(e) => {
          e.preventDefault();
          handleToggleMark(BoldPlugin.key);
        }}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 hover:bg-accent"
        onMouseDown={(e) => {
          e.preventDefault();
          handleToggleMark(ItalicPlugin.key);
        }}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 hover:bg-accent"
        onMouseDown={(e) => {
          e.preventDefault();
          handleToggleMark(UnderlinePlugin.key);
        }}
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 hover:bg-accent"
        onMouseDown={(e) => {
          e.preventDefault();
          handleToggleMark(StrikethroughPlugin.key);
        }}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-5" />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 hover:bg-accent"
        onMouseDown={(e) => {
          e.preventDefault();
          handleToggleMark(CodePlugin.key);
        }}
      >
        <Code className="h-4 w-4" />
      </Button>
    </div>
  );
}


