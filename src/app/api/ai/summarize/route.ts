import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { defaultModel } from "@/lib/ai";
import { db } from "@/lib/db";
import { extractPlainText } from "@/lib/content";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { noteId, content } = await request.json();

    // Extract plain text for summarization
    const plainText = extractPlainText(content);

    if (!plainText || plainText.length < 50) {
      return NextResponse.json(
        { error: "Note is too short to summarize" },
        { status: 400 }
      );
    }

    const { text: summary } = await generateText({
      model: defaultModel,
      system: `You are a helpful assistant that creates concise summaries of notes.

Rules:
- Create a brief summary (2-4 sentences)
- Capture the main points and key information
- Use clear, concise language
- Do not add information not present in the original text
- Match the language of the input`,
      prompt: `Summarize this note:\n\n${plainText}`,
    });

    // Save summary to database if noteId provided. updateMany scopes the write
    // to the owner without throwing when the note is not theirs.
    if (noteId) {
      const { count } = await db.note.updateMany({
        where: { id: noteId, userId },
        data: { summary },
      });

      if (count === 0) {
        return NextResponse.json({ error: "Note not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[AI_SUMMARIZE]", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
