import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { streamText } from "ai";
import { defaultModel } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();

    // Extract plain text for context
    const plainText = extractPlainText(content);

    const result = streamText({
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

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("[AI_COMPLETE]", error);
    return NextResponse.json(
      { error: "Failed to generate completion" },
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
