import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/notes - Get all notes for the current user
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");
    const filter = searchParams.get("filter");
    const query = searchParams.get("q");

    // Build the where clause
    const where: any = {
      userId,
      isArchived: filter === "archive",
    };

    if (filter === "favorites") {
      where.isFavorite = true;
      where.isArchived = false;
    }

    if (folderId) {
      where.folderId = folderId;
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: "insensitive" } },
        { plainText: { contains: query, mode: "insensitive" } },
      ];
    }

    const notes = await db.note.findMany({
      where,
      include: {
        folder: true,
        tags: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("[NOTES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/notes - Create a new note
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in database
    await db.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: "", // Will be updated by webhook
      },
      update: {},
    });

    const body = await request.json();
    const { title, content, folderId, tags } = body;

    // Extract plain text from content for search
    const plainText = extractPlainText(content);

    const note = await db.note.create({
      data: {
        title: title || "Untitled",
        content,
        plainText,
        userId,
        folderId,
        tags: tags
          ? {
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

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("[NOTES_POST]", error);
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
