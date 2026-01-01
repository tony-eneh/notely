"use client";

import React from "react";
import { cn } from "@/lib/utils";

// Filter out Plate internal props that shouldn't be passed to DOM elements
function filterPlateProps(props: Record<string, any>) {
  const {
    // Plate internal props
    setOption,
    setOptions,
    getOption,
    getOptions,
    useOption,
    api,
    tf,
    transforms,
    editor,
    element,
    leaf,
    text,
    path,
    nodeProps,
    // Keep these
    attributes,
    children,
    className,
    ...rest
  } = props;
  return { attributes, children, className, ...rest };
}

// Simple wrapper components that render proper HTML elements
// These are used by Plate's plugin render config

interface ElementProps {
  className?: string;
  children?: React.ReactNode;
  attributes?: any;
  [key: string]: any;
}

// Paragraph
export function ParagraphElement(props: ElementProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <p className={cn("m-0 px-0 py-1", className)} {...attributes} {...rest}>
      {children}
    </p>
  );
}

// Headings
export function H1Element(props: ElementProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <h1 className={cn("mb-1 mt-6 text-4xl font-bold", className)} {...attributes} {...rest}>
      {children}
    </h1>
  );
}

export function H2Element(props: ElementProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <h2 className={cn("mb-1 mt-5 text-2xl font-semibold", className)} {...attributes} {...rest}>
      {children}
    </h2>
  );
}

export function H3Element(props: ElementProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <h3 className={cn("mb-1 mt-4 text-xl font-semibold", className)} {...attributes} {...rest}>
      {children}
    </h3>
  );
}

// Blockquote
export function BlockquoteElement(props: ElementProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <blockquote className={cn("my-2 border-l-4 border-primary/30 pl-4 italic", className)} {...attributes} {...rest}>
      {children}
    </blockquote>
  );
}

// Code Block
export function CodeBlockElement(props: ElementProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <pre className={cn("my-2 rounded-md bg-muted p-4 font-mono text-sm", className)} {...attributes} {...rest}>
      <code>{children}</code>
    </pre>
  );
}

export function CodeLineElement(props: ElementProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <div className={className} {...attributes} {...rest}>
      {children}
    </div>
  );
}

// Horizontal Rule
export function HrElement(props: ElementProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <div className={cn("my-4", className)} {...attributes} {...rest}>
      <hr className="border-t border-muted-foreground/20" />
      {children}
    </div>
  );
}

// Lists
export function UlElement(props: ElementProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <ul className={cn("my-2 ml-6 list-disc", className)} {...attributes} {...rest}>
      {children}
    </ul>
  );
}

export function OlElement(props: ElementProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <ol className={cn("my-2 ml-6 list-decimal", className)} {...attributes} {...rest}>
      {children}
    </ol>
  );
}

export function LiElement(props: ElementProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <li className={cn("my-1", className)} {...attributes} {...rest}>
      {children}
    </li>
  );
}

// Link
export function LinkElement(props: ElementProps & { element?: { url?: string } }) {
  const { element } = props; // Get element before filtering (it's filtered out by filterPlateProps)
  const { attributes, children, className, ...filteredProps } = filterPlateProps(props);
  return (
    <a 
      href={element?.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={cn("text-primary underline underline-offset-4 hover:text-primary/80", className)} 
      {...attributes} 
      {...filteredProps}
    >
      {children}
    </a>
  );
}

// Marks (inline formatting)
interface LeafProps {
  className?: string;
  children?: React.ReactNode;
  attributes?: any;
  [key: string]: any;
}

export function BoldLeaf(props: LeafProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <strong className={cn("font-bold", className)} {...attributes} {...rest}>
      {children}
    </strong>
  );
}

export function ItalicLeaf(props: LeafProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <em className={cn("italic", className)} {...attributes} {...rest}>
      {children}
    </em>
  );
}

export function UnderlineLeaf(props: LeafProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <u className={cn("underline underline-offset-4", className)} {...attributes} {...rest}>
      {children}
    </u>
  );
}

export function StrikethroughLeaf(props: LeafProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <s className={cn("line-through", className)} {...attributes} {...rest}>
      {children}
    </s>
  );
}

export function CodeLeaf(props: LeafProps) {
  const { attributes, children, className, ...rest } = filterPlateProps(props);
  return (
    <code className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-sm", className)} {...attributes} {...rest}>
      {children}
    </code>
  );
}
