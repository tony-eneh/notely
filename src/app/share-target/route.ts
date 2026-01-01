import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      // If unauthenticated, direct to sign-in with return to notes
      return NextResponse.redirect(new URL("/sign-in?redirect_url=/notes", request.url));
    }

    const formData = await request.formData();
    const sharedTitle = (formData.get("title") as string) || "Shared item";
    const sharedText = (formData.get("text") as string) || "";
    const sharedUrl = (formData.get("url") as string) || "";

    // Ensure user exists (webhook may not have run yet)
    await db.user.upsert({
      where: { id: userId },
      create: { id: userId, email: "" },
      update: {},
    });

    const blocks: any[] = [];

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

    const plainText = blocks
      .map((node) => {
        if (node.children?.length) {
          return node.children
            .map((child: any) => (typeof child.text === "string" ? child.text : ""))
            .join("");
        }
        return "";
      })
      .join("\n")
      .trim();

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

    // Redirect to the newly created note
    return NextResponse.redirect(new URL(`/notes/${note.id}`, request.url));
  } catch (error) {
    console.error("[SHARE_TARGET_POST]", error);
    return NextResponse.redirect(new URL("/notes?share=failed", request.url));
  }
}
