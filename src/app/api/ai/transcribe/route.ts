import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get form data with audio file
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file size (10 minutes at ~1MB/min = 10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: "Audio file too large. Maximum 10 minutes allowed." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
    ];
    
    if (!allowedTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: `Invalid audio format. Supported: ${allowedTypes.join(", ")}` },
        { status: 400 }
      );
    }

    console.log("[TRANSCRIBE] Processing audio file:", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    });

    // Upload to Vercel Blob
    const blob = await put(`voice-notes/${userId}/${Date.now()}-${audioFile.name}`, audioFile, {
      access: "public",
      addRandomSuffix: false,
    });

    console.log("[TRANSCRIBE] Uploaded to blob:", blob.url);

    // Transcribe with OpenAI Whisper
    // Note: Whisper API requires File or Blob, not a URL
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      response_format: "verbose_json",
    });

    console.log("[TRANSCRIBE] Transcription completed:", {
      text: transcription.text.substring(0, 100) + "...",
      language: (transcription as any).language || "unknown",
    });

    // Calculate duration (approximate based on file size - actual duration would require audio processing)
    // Rough estimate: 1 minute of audio ~= 1MB for most compressed formats
    const estimatedDuration = audioFile.size / (1024 * 1024) * 60; // in seconds

    return NextResponse.json({
      success: true,
      transcription: transcription.text,
      language: (transcription as any).language || "unknown",
      audioUrl: blob.url,
      audioSize: audioFile.size,
      audioDuration: estimatedDuration,
    });
  } catch (error) {
    console.error("[TRANSCRIBE]", error);
    
    // Handle OpenAI API errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number; code?: string; message?: string };
      
      // Quota exceeded
      if (apiError.status === 429 || apiError.code === 'insufficient_quota') {
        return NextResponse.json(
          { 
            error: "AI service quota exceeded. Please check your OpenAI API billing and usage limits.",
            code: "quota_exceeded"
          },
          { status: 429 }
        );
      }
      
      // Rate limit
      if (apiError.code === 'rate_limit_exceeded') {
        return NextResponse.json(
          { 
            error: "Too many requests. Please wait a moment and try again.",
            code: "rate_limit"
          },
          { status: 429 }
        );
      }
    }
    
    // Handle generic OpenAI errors
    if (error instanceof Error && error.message.includes("audio")) {
      return NextResponse.json(
        { 
          error: "Audio transcription failed. Please try again with a clearer recording.",
          code: "transcription_failed"
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to process audio. Please try again.",
        code: "processing_failed"
      },
      { status: 500 }
    );
  }
}
