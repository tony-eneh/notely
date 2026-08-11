import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/user";

// GET /api/folders - Get the current user's folders
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folders = await db.folder.findMany({
      where: { userId, parentId: null },
      include: {
        children: true,
        _count: { select: { notes: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("[FOLDERS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/folders - Create a folder
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const parentId = typeof body.parentId === "string" ? body.parentId : null;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (name.length > 60) {
      return NextResponse.json(
        { error: "Name must be 60 characters or fewer" },
        { status: 400 }
      );
    }

    await ensureUser(userId);

    // Don't let a folder be nested under someone else's folder.
    if (parentId) {
      const parent = await db.folder.findFirst({
        where: { id: parentId, userId },
        select: { id: true },
      });
      if (!parent) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 }
        );
      }
    }

    const folder = await db.folder.create({
      data: {
        name,
        userId,
        parentId,
        color: typeof body.color === "string" ? body.color : null,
      },
      include: {
        children: true,
        _count: { select: { notes: true } },
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("[FOLDERS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
