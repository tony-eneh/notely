"use client";

import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Type,
} from "lucide-react";
import { useEditorRef } from "@udecode/plate/react";

export interface SlashMenuItem {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  type: string;
}

export const slashMenuItems: SlashMenuItem[] = [
  {
    key: "p",
    label: "Text",
    description: "Just start writing with plain text",
    icon: <Type className="h-4 w-4" />,
    type: "p",
  },
  {
    key: "h1",
    label: "Heading 1",
    description: "Big section heading",
    icon: <Heading1 className="h-4 w-4" />,
    type: "h1",
  },
  {
    key: "h2",
    label: "Heading 2",
    description: "Medium section heading",
    icon: <Heading2 className="h-4 w-4" />,
    type: "h2",
  },
  {
    key: "h3",
    label: "Heading 3",
    description: "Small section heading",
    icon: <Heading3 className="h-4 w-4" />,
    type: "h3",
  },
  {
    key: "ul",
    label: "Bulleted list",
    description: "Create a simple bulleted list",
    icon: <List className="h-4 w-4" />,
    type: "ul",
  },
  {
    key: "ol",
    label: "Numbered list",
    description: "Create a list with numbering",
    icon: <ListOrdered className="h-4 w-4" />,
    type: "ol",
  },
  {
    key: "blockquote",
    label: "Quote",
    description: "Capture a quote",
    icon: <Quote className="h-4 w-4" />,
    type: "blockquote",
  },
  {
    key: "code_block",
    label: "Code",
    description: "Capture a code snippet",
    icon: <Code className="h-4 w-4" />,
    type: "code_block",
  },
  {
    key: "hr",
    label: "Divider",
    description: "Visually divide blocks",
    icon: <Minus className="h-4 w-4" />,
    type: "hr",
  },
];
