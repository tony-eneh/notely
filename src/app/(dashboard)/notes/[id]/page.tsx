import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { NoteEditorClient } from "@/components/notes/note-editor-client";

interface NotePageProps {
  params: Promise<{ id: string }>;
}

export default async function NotePage({ params }: NotePageProps) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  let note = null;

  try {
    note = await db.note.findUnique({
      where: {
        id,
        userId,
      },
      include: {
        folder: true,
        tags: true,
      },
    });
  } catch {
    // Database not connected
  }

  if (!note) {
    notFound();
  }

  return <NoteEditorClient note={note} />;
}
