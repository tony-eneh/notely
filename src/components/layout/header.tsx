"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";

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

  // Keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (isAiSearch) {
      router.push(`/notes?q=${encodeURIComponent(searchQuery)}&ai=true`);
    } else {
      router.push(`/notes?q=${encodeURIComponent(searchQuery)}`);
    }
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border/40 bg-background/80 px-6 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground transition-colors" />
      
      {title && (
        <div className="flex items-center gap-3">
          <div className="h-5 w-px bg-border" />
          <h1 className="font-display text-lg font-semibold text-foreground">{title}</h1>
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        <Button
          variant="outline"
          className="relative h-10 w-10 p-0 xl:h-10 xl:w-72 xl:justify-start xl:px-4 xl:py-2 border-border/50 bg-secondary/30 hover:bg-secondary/50 hover:border-border transition-all duration-200"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4 text-muted-foreground xl:mr-3" />
          <span className="hidden xl:inline-flex text-muted-foreground font-normal">
            Search your notes...
          </span>
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded-md border border-border/50 bg-background px-2 font-mono text-[10px] font-medium text-muted-foreground xl:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-border/50 shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Search Notes</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch}>
            <div className="flex items-center border-b border-border/50 px-4 bg-card">
              <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your notes..."
                className="flex h-14 w-full rounded-none border-0 bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-between gap-3 p-4 bg-muted/30">
              <Button
                type="button"
                variant={isAiSearch ? "default" : "outline"}
                size="sm"
                className={`gap-2 transition-all duration-200 ${
                  isAiSearch 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
                }`}
                onClick={() => setIsAiSearch(!isAiSearch)}
              >
                <Sparkles className={`h-3.5 w-3.5 ${isAiSearch ? "animate-pulse" : ""}`} />
                AI Search
              </Button>
              <span className="text-xs text-muted-foreground">
                {isAiSearch
                  ? "✨ Semantic search powered by AI"
                  : "Search by title and content"}
              </span>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
}
