"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Download } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
  className?: string;
}

export function AudioPlayer({ audioUrl, duration, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setTotalDuration(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.remove();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * totalDuration;

    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `voice-note-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div
      className={cn(
        "card-paper rounded-xl border border-border/50 p-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <Button
          size="icon"
          variant="outline"
          onClick={togglePlay}
          className="h-10 w-10 rounded-full shrink-0"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </Button>

        {/* Progress Bar */}
        <div className="flex-1 space-y-1">
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            className="h-2 bg-muted rounded-full cursor-pointer overflow-hidden"
          >
            <motion.div
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Volume Control */}
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleMute}
          className="h-8 w-8 shrink-0 text-muted-foreground"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>

        {/* Download Button */}
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDownload}
          className="h-8 w-8 shrink-0 text-muted-foreground"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
