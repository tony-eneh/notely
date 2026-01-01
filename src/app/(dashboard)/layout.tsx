import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, Header } from "@/components/layout";
import { db } from "@/lib/db";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch folders for the sidebar
  let folders: Awaited<ReturnType<typeof db.folder.findMany>> = [];
  
  try {
    folders = await db.folder.findMany({
      where: {
        userId,
        parentId: null, // Only top-level folders
      },
      include: {
        children: true,
        _count: {
          select: { notes: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
  } catch {
    // Database not initialized yet, continue with empty folders
    console.log("Database not connected yet");
  }

  return (
    <SidebarProvider>
      <AppSidebar folders={folders} />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
