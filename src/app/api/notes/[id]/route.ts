import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/notes/[id] - Get a specific note
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const note = await db.note.findUnique({
      where: {
        id,
        userId,
      },
      include: {
        folder: true,
        tags: true,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error("[NOTE_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/notes/[id] - Update a note
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      title, 
      content, 
      folderId, 
      isFavorite, 
      isArchived, 
      summary, 
      tags,
      audioUrl,
      audioSize,
      audioDuration,
      transcriptionStatus,
    } = body;

    // Check if note exists and belongs to user
    const existingNote = await db.note.findUnique({
      where: { id, userId },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Extract plain text from content for search
    const plainText = content ? extractPlainText(content) : existingNote.plainText;

    const note = await db.note.update({
      where: { id },
      data: {
        title,
        content,
        plainText,
        folderId,
        isFavorite,
        isArchived,
        summary,
        audioUrl,
        audioSize,
        audioDuration,
        transcriptionStatus,
        tags: tags
          ? {
              set: [], // Remove existing tags
              connectOrCreate: tags.map((tag: string) => ({
                where: { name: tag },
                create: { name: tag },
              })),
            }
          : undefined,
      },
      include: {
        folder: true,
        tags: true,
      },
    });

    return NextResponse.json(note);
  } catch (error) {
    console.error("[NOTE_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if note exists and belongs to user
    const existingNote = await db.note.findUnique({
      where: { id, userId },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await db.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[NOTE_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to extract plain text from Plate content
function extractPlainText(content: any): string {
  if (!content || !Array.isArray(content)) return "";

  const extractText = (node: any): string => {
    if (typeof node.text === "string") return node.text;
    if (Array.isArray(node.children)) {
      return node.children.map(extractText).join("");
    }
    return "";
  };

  return content.map(extractText).join("\n").trim();
}
