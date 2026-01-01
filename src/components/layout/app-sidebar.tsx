"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  FileText,
  FolderClosed,
  Plus,
  Settings,
  Star,
  Archive,
  ChevronRight,
  Feather,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder } from "@/types";

const mainNavItems = [
  { title: "All Notes", href: "/notes", icon: FileText },
  { title: "Favorites", href: "/notes?filter=favorites", icon: Star },
  { title: "Archive", href: "/notes?filter=archive", icon: Archive },
];

interface AppSidebarProps {
  folders?: Folder[];
}

export function AppSidebar({ folders = [] }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleNewNote = () => {
    router.push("/notes/new");
  };

  return (
    <Sidebar className="border-r-0 bg-sidebar">
      {/* Brand Header */}
      <SidebarHeader className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary/10 ring-1 ring-sidebar-primary/20">
            <Feather className="h-5 w-5 text-sidebar-primary" />
          </div>
          <div className="flex flex-col">
            <span className="sidebar-brand text-xl font-semibold text-sidebar-foreground">
              Notely
            </span>
            <span className="text-[11px] uppercase tracking-widest text-sidebar-foreground/50">
              Write beautifully
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* New Note Button */}
      <div className="px-4 pb-4">
        <Button
          onClick={handleNewNote}
          className="w-full justify-center gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 shadow-md shadow-sidebar-primary/20 font-medium tracking-wide"
        >
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>

      <SidebarContent>
        <ScrollArea className="h-full px-2">
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className={cn(
                          "relative px-3 py-2.5 transition-all duration-200",
                          isActive && "bg-sidebar-accent sidebar-item-active"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className={cn(
                            "h-4 w-4 transition-colors",
                            isActive ? "text-sidebar-primary" : "text-sidebar-foreground/60"
                          )} />
                          <span className={cn(
                            "font-medium",
                            isActive ? "text-sidebar-foreground" : "text-sidebar-foreground/80"
                          )}>
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Divider */}
          <div className="my-4 mx-3 h-px bg-sidebar-border" />

          {/* Folders Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between px-3 text-[11px] uppercase tracking-widest text-sidebar-foreground/50 font-medium">
              <span>Collections</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => {/* TODO: Create folder modal */}}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {folders.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-sidebar-accent/50 flex items-center justify-center mb-3">
                      <FolderClosed className="h-6 w-6 text-sidebar-foreground/30" />
                    </div>
                    <p className="text-xs text-sidebar-foreground/40">
                      No collections yet
                    </p>
                  </div>
                ) : (
                  folders.map((folder) => (
                    <SidebarMenuItem key={folder.id}>
                      <SidebarMenuButton
                        onClick={() => toggleFolder(folder.id)}
                        className="group px-3 py-2"
                      >
                        <motion.div
                          animate={{ rotate: expandedFolders.has(folder.id) ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/40" />
                        </motion.div>
                        <FolderClosed
                          className="h-4 w-4"
                          style={{ color: folder.color || 'var(--sidebar-primary)' }}
                        />
                        <span className="flex-1 truncate text-sidebar-foreground/80 font-medium">
                          {folder.name}
                        </span>
                        {folder._count && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-sidebar-accent text-sidebar-foreground/50">
                            {folder._count.notes}
                          </span>
                        )}
                      </SidebarMenuButton>
                      <AnimatePresence>
                        {expandedFolders.has(folder.id) && folder.children && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <SidebarMenuSub>
                              {folder.children.map((child) => (
                                <SidebarMenuSubItem key={child.id}>
                                  <SidebarMenuSubButton asChild className="py-2">
                                    <Link href={`/notes?folder=${child.id}`}>
                                      <FolderClosed
                                        className="h-3 w-3"
                                        style={{ color: child.color || 'var(--sidebar-primary)' }}
                                      />
                                      <span className="text-sidebar-foreground/70">{child.name}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      {/* Footer with User */}
      <SidebarFooter className="p-4">
        <div className="h-px bg-sidebar-border mb-4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 ring-2 ring-sidebar-primary/20",
                },
              }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-sidebar-foreground">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split("@")[0]}
              </span>
              <span className="text-[11px] text-sidebar-foreground/50 truncate max-w-[120px]">
                {user?.emailAddresses[0]?.emailAddress}
              </span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            asChild
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
