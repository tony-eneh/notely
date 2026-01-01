import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { embed, cosineSimilarity } from "ai";
import { embeddingModel, defaultModel } from "@/lib/ai";
import { generateText } from "ai";
import { db } from "@/lib/db";
import { Note, Folder, Tag } from "@/types";

interface NoteWithRelations extends Note {
  folder: Folder | null;
  tags: Tag[];
}

interface NoteWithScore {
  note: NoteWithRelations;
  similarity: number;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, useAi = false } = await request.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (useAi) {
      // AI-powered semantic search
      return await semanticSearch(userId, query);
    } else {
      // Regular text search
      return await textSearch(userId, query);
    }
  } catch (error) {
    console.error("[AI_SEARCH]", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

// Regular text search using database
async function textSearch(userId: string, query: string) {
  const notes = await db.note.findMany({
    where: {
      userId,
      isArchived: false,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { plainText: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      folder: true,
      tags: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ notes, type: "text" });
}

// AI-powered semantic search using embeddings
async function semanticSearch(userId: string, query: string) {
  // Get all user's notes
  const allNotes = await db.note.findMany({
    where: {
      userId,
      isArchived: false,
      plainText: { not: null },
    },
    include: {
      folder: true,
      tags: true,
    },
  });

  if (allNotes.length === 0) {
    return NextResponse.json({ notes: [], type: "semantic" });
  }

  // Generate embedding for the query
  const { embedding: queryEmbedding } = await embed({
    model: embeddingModel,
    value: query,
  });

  // Generate embeddings for all notes and calculate similarity
  const notesWithScores: NoteWithScore[] = await Promise.all(
    allNotes.map(async (note) => {
      const text = `${note.title}\n${note.plainText || ""}`;
      const { embedding: noteEmbedding } = await embed({
        model: embeddingModel,
        value: text.slice(0, 8000), // Limit text length for embeddings
      });

      const similarity = cosineSimilarity(queryEmbedding, noteEmbedding);
      return { note: note as NoteWithRelations, similarity };
    })
  );

  // Sort by similarity and filter out low scores
  const relevantNotes = notesWithScores
    .filter(({ similarity }) => similarity > 0.3)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 10)
    .map(({ note, similarity }) => ({
      ...note,
      relevanceScore: Math.round(similarity * 100),
    }));

  // Generate a helpful response about the search results
  let aiResponse = "";
  if (relevantNotes.length > 0) {
    const { text } = await generateText({
      model: defaultModel,
      system: "You are a helpful assistant. Briefly explain what notes were found based on the user's query. Be concise (1-2 sentences).",
      prompt: `User searched for: "${query}"\nFound ${relevantNotes.length} relevant notes with titles: ${relevantNotes.map((n) => n.title).join(", ")}`,
    });
    aiResponse = text;
  }

  return NextResponse.json({
    notes: relevantNotes,
    type: "semantic",
    aiResponse,
  });
}
