import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ensureUser } from "@/lib/user";
import { extractPlainText } from "@/lib/content";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      // If unauthenticated, direct to sign-in with return to notes.
      // 303 so the browser follows up with GET rather than replaying the POST.
      return NextResponse.redirect(
        new URL("/sign-in?redirect_url=/notes", request.url),
        303
      );
    }

    const formData = await request.formData();
    const sharedTitle = (formData.get("title") as string) || "Shared item";
    const sharedText = (formData.get("text") as string) || "";
    const sharedUrl = (formData.get("url") as string) || "";

    // Ensure user exists (webhook may not have run yet)
    await ensureUser(userId);

    const blocks: { type: string; children: { text: string }[] }[] = [];

    blocks.push({
      type: "h2",
      children: [{ text: sharedTitle }],
    });

    if (sharedText) {
      blocks.push({
        type: "p",
        children: [{ text: sharedText }],
      });
    }

    if (sharedUrl) {
      blocks.push({
        type: "p",
        children: [{ text: `Source: ${sharedUrl}` }],
      });
    }

    if (blocks.length === 0) {
      blocks.push({ type: "p", children: [{ text: "" }] });
    }

    const plainText = extractPlainText(blocks);

    const note = await db.note.create({
      data: {
        title: sharedTitle || "Untitled",
        content: blocks,
        plainText,
        userId,
      },
      include: {
        folder: true,
        tags: true,
      },
    });

    // Redirect to the newly created note. 303 (See Other) turns the share
    // POST into a GET; the default 307 would replay the POST against the note
    // page, which only handles GET.
    return NextResponse.redirect(new URL(`/notes/${note.id}`, request.url), 303);
  } catch (error) {
    console.error("[SHARE_TARGET_POST]", error);
    return NextResponse.redirect(new URL("/notes?share=failed", request.url), 303);
  }
}
