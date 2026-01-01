"use client";

import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Sparkles,
  FileText,
  Wand2,
} from "lucide-react";
import { useEditorRef } from "@udecode/plate/react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ToolbarButtonProps {
  isActive?: boolean;
  onClick: () => void;
  tooltip: string;
  children: React.ReactNode;
}

function ToolbarButton({ isActive, onClick, tooltip, children }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0",
            isActive && "bg-accent text-accent-foreground"
          )}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface EditorToolbarProps {
  onAiSummarize?: () => void;
  onAiComplete?: () => void;
  isSummarizing?: boolean;
}

export function EditorToolbar({ onAiSummarize, onAiComplete, isSummarizing }: EditorToolbarProps) {
  const editor = useEditorRef();

  const formatMark = (mark: string) => {
    editor.tf.addMark(mark, true);
  };

  const formatBlock = (type: string) => {
    editor.tf.setNodes({ type });
  };

  const insertHorizontalRule = () => {
    editor.tf.insertNodes({
      type: "hr",
      children: [{ text: "" }],
    });
  };

  return (
    <div className="flex items-center gap-0.5 rounded-lg border bg-background p-1 shadow-sm">
      {/* Text Marks */}
      <ToolbarButton
        onClick={() => formatMark("bold")}
        tooltip="Bold (⌘B)"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatMark("italic")}
        tooltip="Italic (⌘I)"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatMark("underline")}
        tooltip="Underline (⌘U)"
      >
        <Underline className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatMark("strikethrough")}
        tooltip="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatMark("code")}
        tooltip="Code"
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <ToolbarButton
        onClick={() => formatBlock("h1")}
        tooltip="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatBlock("h2")}
        tooltip="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatBlock("h3")}
        tooltip="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => formatBlock("ul")}
        tooltip="Bullet List"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => formatBlock("ol")}
        tooltip="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Block Elements */}
      <ToolbarButton
        onClick={() => formatBlock("blockquote")}
        tooltip="Quote"
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={insertHorizontalRule}
        tooltip="Divider"
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* AI Features */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-medium">AI</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>AI Features</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onAiComplete} disabled={!onAiComplete}>
            <Wand2 className="mr-2 h-4 w-4" />
            Continue writing
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAiSummarize} disabled={isSummarizing || !onAiSummarize}>
            <FileText className="mr-2 h-4 w-4" />
            {isSummarizing ? "Summarizing..." : "Summarize note"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
