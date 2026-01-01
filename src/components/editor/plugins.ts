"use client";

import {
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
} from "@udecode/plate-basic-marks/react";
import { HeadingPlugin } from "@udecode/plate-heading/react";
import { BlockquotePlugin } from "@udecode/plate-block-quote/react";
import { CodeBlockPlugin } from "@udecode/plate-code-block/react";
import { HorizontalRulePlugin } from "@udecode/plate-horizontal-rule/react";
import { LinkPlugin } from "@udecode/plate-link/react";
import { ListPlugin, BulletedListPlugin, NumberedListPlugin, ListItemPlugin } from "@udecode/plate-list/react";

// Basic formatting plugins
export const basicMarksPlugins = [
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
];

// Block element plugins
export const blockPlugins = [
  HeadingPlugin,
  BlockquotePlugin,
  CodeBlockPlugin,
  HorizontalRulePlugin,
];

// List plugins
export const listPlugins = [
  ListPlugin,
  BulletedListPlugin,
  NumberedListPlugin,
  ListItemPlugin,
];

// Link plugin
export const linkPlugins = [
  LinkPlugin.configure({
    options: {
      defaultLinkAttributes: {
        target: "_blank",
        rel: "noopener noreferrer",
      },
    },
  }),
];

// Combined plugins for the editor
export const editorPlugins = [
  ...basicMarksPlugins,
  ...blockPlugins,
  ...listPlugins,
  ...linkPlugins,
];
