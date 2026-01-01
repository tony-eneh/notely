"use client";

import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
} from "@udecode/plate-basic-marks/react";
import { ParagraphPlugin } from "@udecode/plate/react";
import { HeadingPlugin } from "@udecode/plate-heading/react";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import { CodeBlockPlugin, CodeLinePlugin } from "@udecode/plate-code-block/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { LinkPlugin } from "@udecode/plate-link/react";
import { ListPlugin, BulletedListPlugin, NumberedListPlugin, ListItemPlugin } from "@udecode/plate-list/react";

// Notion-like features
import { NodeIdPlugin } from "@udecode/plate-node-id";
import { DndPlugin } from "@udecode/plate-dnd";
import { BlockSelectionPlugin } from "@udecode/plate-selection/react";
import { TrailingBlockPlugin } from "@udecode/plate-trailing-block";

// Custom element components
import {
  ParagraphElement,
  BlockquoteElement,
  CodeBlockElement,
  CodeLineElement,
  HrElement,
  UlElement,
  OlElement,
  LiElement,
  LinkElement,
  BoldLeaf,
  ItalicLeaf,
  UnderlineLeaf,
  StrikethroughLeaf,
  CodeLeaf,
} from "./plate-components";

// Basic formatting plugins with custom leaf components
export const basicMarksPlugins = [
  BoldPlugin.configure({
    render: { node: BoldLeaf },
  }),
  ItalicPlugin.configure({
    render: { node: ItalicLeaf },
  }),
  UnderlinePlugin.configure({
    render: { node: UnderlineLeaf },
  }),
  StrikethroughPlugin.configure({
    render: { node: StrikethroughLeaf },
  }),
  CodePlugin.configure({
    render: { node: CodeLeaf },
  }),
];

// Block element plugins with custom element components
export const blockPlugins = [
  ParagraphPlugin.configure({
    render: { node: ParagraphElement },
  }),
  // HeadingPlugin uses Plate's default rendering with slate-h1/h2/h3 classes
  // We style these with CSS
  HeadingPlugin.configure({
    options: {
      levels: 3,
    },
  }),
  BlockquotePlugin.configure({
    render: { node: BlockquoteElement },
  }),
  CodeBlockPlugin.configure({
    render: { node: CodeBlockElement },
  }),
  CodeLinePlugin.configure({
    render: { node: CodeLineElement },
  }),
  HorizontalRulePlugin.configure({
    render: { node: HrElement },
  }),
];

// List plugins with custom components
export const listPlugins = [
  ListPlugin,
  BulletedListPlugin.configure({
    render: { node: UlElement },
  }),
  NumberedListPlugin.configure({
    render: { node: OlElement },
  }),
  ListItemPlugin.configure({
    render: { node: LiElement },
  }),
];

// Link plugin with custom component
export const linkPlugins = [
  LinkPlugin.configure({
    options: {
      defaultLinkAttributes: {
        target: "_blank",
        rel: "noopener noreferrer",
      },
    },
    render: { node: LinkElement },
  }),
];

// Notion-like behavior plugins
export const notionLikePlugins = [
  NodeIdPlugin, // Required for DnD and selection
  BlockSelectionPlugin,
  DndPlugin.configure({
    options: {
      enableScroller: true,
    },
  }),
  TrailingBlockPlugin.configure({
    options: {
      type: ParagraphPlugin.key,
    },
  }),
];

// Combined plugins for the editor
export const editorPlugins = [
  ...notionLikePlugins,
  ...basicMarksPlugins,
  ...blockPlugins,
  ...listPlugins,
  ...linkPlugins,
];
