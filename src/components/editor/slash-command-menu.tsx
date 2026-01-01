"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useEditorRef } from "@udecode/plate/react";
import { cn } from "@/lib/utils";
import { slashMenuItems, SlashMenuItem } from "./slash-menu";
import { Card } from "@/components/ui/card";

export function SlashCommandMenu() {
  const editor = useEditorRef();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter items based on search
  const filteredItems = slashMenuItems.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  const executeCommand = useCallback((item: SlashMenuItem) => {
    if (!editor || !editor.selection) return;

    // Delete the slash and search text using Plate's API
    const deleteCount = search.length + 1; // +1 for the "/"
    for (let i = 0; i < deleteCount; i++) {
      editor.tf.deleteBackward("character");
    }

    // Handle different block types using Plate's transform API
    if (item.type === "hr") {
      // Insert horizontal rule
      editor.tf.insertNodes({
        type: "hr",
        children: [{ text: "" }],
      });
      // Insert a new paragraph after
      editor.tf.insertNodes({
        type: "p",
        children: [{ text: "" }],
      });
    } else if (item.type === "ul" || item.type === "ol") {
      // For lists, insert a proper list structure
      // Plate's list plugin expects: ul/ol > li > lic (list item content)
      editor.tf.insertNodes({
        type: item.type,
        children: [
          {
            type: "li",
            children: [
              {
                type: "lic",
                children: [{ text: "" }],
              },
            ],
          },
        ],
      });
      // Remove the current empty paragraph
      editor.tf.removeNodes();
    } else {
      // For headings, paragraphs, blockquotes, code_block - simple type change
      editor.tf.setNodes({ type: item.type });
    }

    setIsOpen(false);
    setSearch("");
    setSelectedIndex(0);
  }, [editor, search]);

  // Check for slash command trigger
  const checkForSlashCommand = useCallback(() => {
    const domSelection = window.getSelection();
    if (!domSelection || !domSelection.anchorNode) return;

    const textContent = domSelection.anchorNode.textContent || "";
    const cursorOffset = domSelection.anchorOffset;
    const textBeforeCursor = textContent.slice(0, cursorOffset);

    // Find the last "/" in the text
    const slashIndex = textBeforeCursor.lastIndexOf("/");
    
    if (slashIndex !== -1) {
      const afterSlash = textBeforeCursor.slice(slashIndex + 1);
      
      // Only open if slash is at beginning or after a space/newline
      const charBeforeSlash = slashIndex > 0 ? textBeforeCursor[slashIndex - 1] : " ";
      if (charBeforeSlash === " " || charBeforeSlash === "\n" || slashIndex === 0) {
        setSearch(afterSlash);
        setSelectedIndex(0);
        
        if (!isOpen) {
          setIsOpen(true);
        }
        
        // Get cursor position for menu
        const range = domSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 4,
          left: rect.left + window.scrollX,
        });
        return;
      }
    }
    
    // Close if no valid slash command
    if (isOpen) {
      setIsOpen(false);
      setSearch("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      // Don't check if menu is handling navigation keys
      if (isOpen && ["ArrowDown", "ArrowUp", "Enter", "Tab", "Escape"].includes(e.key)) {
        return;
      }
      
      // Small delay to let the editor update
      setTimeout(checkForSlashCommand, 10);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        setSearch("");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => 
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
      } else if ((e.key === "Enter" || e.key === "Tab") && filteredItems.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        executeCommand(filteredItems[selectedIndex]);
      } else if (e.key === "Backspace") {
        // Check if we should close after backspace
        setTimeout(checkForSlashCommand, 10);
      }
    };

    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen, filteredItems, selectedIndex, executeCommand, checkForSlashCommand]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reset selected index when filtered items change
  useEffect(() => {
    if (selectedIndex >= filteredItems.length) {
      setSelectedIndex(Math.max(0, filteredItems.length - 1));
    }
  }, [filteredItems.length, selectedIndex]);

  if (!isOpen || filteredItems.length === 0) return null;

  return (
    <Card
      ref={menuRef}
      data-slash-menu
      className="fixed z-50 w-[320px] max-h-96 overflow-y-auto p-2 shadow-lg border bg-popover animate-in fade-in-0 zoom-in-95"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="text-xs font-medium text-muted-foreground px-3 py-1.5 uppercase tracking-wider">
        Basic blocks
      </div>
      {filteredItems.map((item, index) => (
        <button
          key={item.key}
          className={cn(
            "w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors",
            "hover:bg-accent",
            index === selectedIndex && "bg-accent"
          )}
          onMouseDown={(e) => {
            e.preventDefault();
            executeCommand(item);
          }}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div className="mt-0.5 p-1.5 rounded bg-muted text-muted-foreground">
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">{item.label}</div>
            <div className="text-xs text-muted-foreground truncate">
              {item.description}
            </div>
          </div>
        </button>
      ))}
    </Card>
  );
}
