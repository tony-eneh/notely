"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Command } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiSearch, setIsAiSearch] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (isAiSearch) {
      // AI-powered semantic search
      router.push(`/notes?q=${encodeURIComponent(searchQuery)}&ai=true`);
    } else {
      // Regular search
      router.push(`/notes?q=${encodeURIComponent(searchQuery)}`);
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border/40 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      
      {title && (
        <h1 className="text-lg font-semibold">{title}</h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          className="relative h-9 w-9 p-0 xl:h-9 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4 xl:mr-2" />
          <span className="hidden xl:inline-flex">Search notes...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[550px] p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Search Notes</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="flex h-12 w-full rounded-md border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2 p-3 border-t bg-muted/50">
              <Button
                type="button"
                variant={isAiSearch ? "default" : "outline"}
                size="sm"
                className="gap-1.5"
                onClick={() => setIsAiSearch(!isAiSearch)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Search
              </Button>
              <span className="text-xs text-muted-foreground">
                {isAiSearch
                  ? "Semantic search powered by AI"
                  : "Search by title and content"}
              </span>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
