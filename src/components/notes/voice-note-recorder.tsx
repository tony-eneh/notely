"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VoiceNoteRecorderProps {
  onTranscriptionComplete: (data: {
    transcription: string;
    audioUrl: string;
    audioSize: number;
    audioDuration: number;
  }) => void;
  onCancel: () => void;
}

type RecorderState = "idle" | "recording" | "stopped" | "transcribing";

export function VoiceNoteRecorder({
  onTranscriptionComplete,
  onCancel,
}: VoiceNoteRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(40).fill(0));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { toast } = useToast();

  const MAX_DURATION = 600; // 10 minutes in seconds

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audioUrl]);

  const visualizeAudio = (stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 128;

    source.connect(analyserRef.current);

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateWaveform = () => {
      if (!analyserRef.current || state !== "recording") return;

      analyserRef.current.getByteFrequencyData(dataArray);

      // Sample and normalize data for visualization
      const step = Math.floor(dataArray.length / 40);
      const samples = [];
      for (let i = 0; i < 40; i++) {
        const value = dataArray[i * step] / 255;
        samples.push(value);
      }

      setWaveformData(samples);
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setState("recording");
      visualizeAudio(stream);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            toast({
              title: "Recording stopped",
              description: "Maximum duration of 10 minutes reached.",
            });
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record voice notes.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      setState("stopped");

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl("");
    setDuration(0);
    setWaveformData(new Array(40).fill(0));
    setState("idle");
    onCancel();
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    setState("transcribing");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, `voice-note-${Date.now()}.webm`);

      const response = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transcription failed");
      }

      toast({
        title: "Transcription complete!",
        description: `Detected language: ${data.language || "auto"}`,
      });

      onTranscriptionComplete({
        transcription: data.transcription,
        audioUrl: data.audioUrl,
        audioSize: data.audioSize,
        audioDuration: data.audioDuration,
      });

      // Reset
      setAudioBlob(null);
      setAudioUrl("");
      setDuration(0);
      setState("idle");
    } catch (error) {
      console.error("Transcription error:", error);
      
      let errorTitle = "Transcription failed";
      let errorDescription = "Please try again";
      
      if (error instanceof Error) {
        // Check if the error message contains specific error codes
        if (error.message.includes("quota") || error.message.includes("429")) {
          errorTitle = "AI Service Unavailable";
          errorDescription = "The AI service quota has been exceeded. Please try again later or contact support.";
        } else if (error.message.includes("rate limit")) {
          errorTitle = "Too Many Requests";
          errorDescription = "Please wait a moment before trying again.";
        } else {
          errorDescription = error.message;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
      setState("stopped");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card-paper rounded-2xl border border-border/50 p-6 shadow-lg"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Status Header */}
        <div className="text-center">
          <h3 className="font-display text-xl font-semibold text-foreground mb-1">
            {state === "idle" && "Voice Note"}
            {state === "recording" && "Recording..."}
            {state === "stopped" && "Preview Recording"}
            {state === "transcribing" && "Transcribing..."}
          </h3>
          <p className="text-sm text-muted-foreground">
            {state === "idle" && "Click the microphone to start"}
            {state === "recording" && formatDuration(duration)}
            {state === "stopped" && `Duration: ${formatDuration(duration)}`}
            {state === "transcribing" && "Converting speech to text..."}
          </p>
        </div>

        {/* Waveform Visualization */}
        <div className="flex items-center justify-center gap-1 h-24 w-full">
          {waveformData.map((value, index) => (
            <motion.div
              key={index}
              className={cn(
                "w-1.5 rounded-full transition-colors",
                state === "recording" ? "bg-primary" : "bg-muted"
              )}
              animate={{
                height: state === "recording"
                  ? `${Math.max(8, value * 80)}px`
                  : "8px",
              }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {state === "idle" && (
              <motion.div
                key="start"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  size="lg"
                  onClick={startRecording}
                  className="btn-shine h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
                >
                  <Mic className="h-6 w-6" />
                </Button>
              </motion.div>
            )}

            {state === "recording" && (
              <motion.div
                key="stop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  size="lg"
                  onClick={stopRecording}
                  className="h-14 w-14 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg"
                >
                  <Square className="h-6 w-6" />
                </Button>
              </motion.div>
            )}

            {state === "stopped" && (
              <motion.div
                key="preview"
                className="flex gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  onClick={togglePlayback}
                  className="h-12 w-12 rounded-full"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={discardRecording}
                  className="h-12 w-12 rounded-full text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>

                <Button
                  size="lg"
                  onClick={transcribeAudio}
                  className="btn-shine gap-2 px-6 shadow-lg shadow-primary/30"
                >
                  <Check className="h-5 w-5" />
                  Create Note
                </Button>
              </motion.div>
            )}

            {state === "transcribing" && (
              <motion.div
                key="transcribing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button size="lg" disabled className="gap-2 px-6">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Transcribing...
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Duration Warning */}
        {state === "recording" && duration > 540 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground"
          >
            ⚠️ {MAX_DURATION - duration} seconds remaining
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
