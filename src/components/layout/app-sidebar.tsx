"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  FileText,
  FolderClosed,
  Home,
  Plus,
  Search,
  Settings,
  Star,
  Archive,
  ChevronRight,
  Sparkles,
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
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight">Notely</span>
            <span className="text-xs text-muted-foreground">Smart notes</span>
          </div>
        </div>
      </SidebarHeader>

      <div className="px-3 py-2">
        <Button
          onClick={handleNewNote}
          className="w-full justify-start gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        >
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>

      <SidebarContent>
        <ScrollArea className="h-full">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className={cn(
                        "transition-colors",
                        pathname === item.href && "bg-accent"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <Separator className="my-2" />

          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center justify-between">
              <span>Folders</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => {/* TODO: Create folder modal */}}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {folders.length === 0 ? (
                  <div className="px-3 py-4 text-center">
                    <FolderClosed className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-xs text-muted-foreground">
                      No folders yet
                    </p>
                  </div>
                ) : (
                  folders.map((folder) => (
                    <SidebarMenuItem key={folder.id}>
                      <SidebarMenuButton
                        onClick={() => toggleFolder(folder.id)}
                        className="group"
                      >
                        <motion.div
                          animate={{ rotate: expandedFolders.has(folder.id) ? 90 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </motion.div>
                        <FolderClosed
                          className="h-4 w-4"
                          style={{ color: folder.color || undefined }}
                        />
                        <span className="flex-1 truncate">{folder.name}</span>
                        {folder._count && (
                          <span className="text-xs text-muted-foreground">
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
                                  <SidebarMenuSubButton asChild>
                                    <Link href={`/notes?folder=${child.id}`}>
                                      <FolderClosed
                                        className="h-3 w-3"
                                        style={{ color: child.color || undefined }}
                                      />
                                      <span>{child.name}</span>
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

      <SidebarFooter className="p-3">
        <Separator className="mb-3" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress?.split("@")[0]}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                {user?.emailAddresses[0]?.emailAddress}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
