import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { generateText } from "ai";
import { defaultModel, aiErrorResponse } from "@/lib/ai";
import { extractPlainText } from "@/lib/content";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();

    // Extract plain text for context
    const plainText = extractPlainText(content);

    if (!plainText.trim()) {
      return NextResponse.json(
        { error: "Write something first so the AI has context to continue." },
        { status: 400 }
      );
    }

    // Deliberately not streamed. The continuation is a sentence or three and
    // the editor inserts it in one go, while a streamed response reports
    // upstream failures mid-body as a 200 with no text, which is
    // indistinguishable from the model returning nothing.
    const { text } = await generateText({
      model: defaultModel,
      system: `You are a helpful writing assistant. Your job is to continue the user's text naturally and coherently.

Rules:
- Continue the writing in the same style and tone
- Keep the continuation concise (1-3 sentences)
- Do not repeat what has already been written
- Do not add any prefixes like "Here's a continuation:" - just continue the text directly
- Match the language of the input (if they write in English, continue in English)`,
      prompt: `Continue this text naturally:\n\n${plainText}`,
    });

    return NextResponse.json({ completion: text });
  } catch (error) {
    const { status, body } = aiErrorResponse("AI_COMPLETE", error);
    return NextResponse.json(body, { status });
  }
}
