import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, Scissors, Volume2, Flame, Maximize2, Sparkles, Activity } from "lucide-react";
import { MediaMetadata } from "../types";

interface MediaPreviewProps {
  metadata: MediaMetadata;
  startTime: number;
  endTime: number;
  setStartTime: (val: number) => void;
  setEndTime: (val: number) => void;
  playbackSpeed: number;
  volumeBoost: number;
}

export default function MediaPreview({
  metadata,
  startTime,
  endTime,
  setStartTime,
  setEndTime,
  playbackSpeed,
  volumeBoost,
}: MediaPreviewProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(startTime);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Synchronize playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, metadata]);

  // Handle trim boundary crossing
  useEffect(() => {
    if (currentTime < startTime) {
      setCurrentTime(startTime);
    }
    if (currentTime > endTime) {
      setCurrentTime(startTime);
      if (videoRef.current) {
        videoRef.current.currentTime = startTime;
      }
    }
  }, [startTime, endTime]);

  // Mock visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const barCount = 42;
    const bars: { x: number; targetH: number; currH: number }[] = [];
    for (let i = 0; i < barCount; i++) {
      bars.push({
        x: (width / barCount) * i,
        targetH: 4,
        currH: 4,
      });
    }

    const draw = () => {
      // Clear
      ctx.clearRect(0, 0, width, height);

      // Render custom digital peaks
      for (let i = 0; i < barCount; i++) {
        const bar = bars[i];
        if (isPlaying) {
          // Dynamic heights reflecting playing state, volume boost and pitch shifts
          bar.targetH = Math.max(
            8,
            Math.sin(Date.now() * 0.006 * playbackSpeed + i * 0.3) * (height * 0.45) * volumeBoost +
              Math.random() * 8
          );
        } else {
          bar.targetH = 4 + Math.sin(i * 0.5) * 6;
        }

        // Interpolate heights smoothly
        bar.currH += (bar.targetH - bar.currH) * 0.2;

        const x = bar.x + 2;
        const barWidth = (width / barCount) - 4;
        const middle = height / 2;

        const grad = ctx.createLinearGradient(0, middle - bar.currH, 0, middle + bar.currH);
        grad.addColorStop(0, "#8b5cf6"); // Purple
        grad.addColorStop(1, "#6366f1"); // Indigo

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, middle - bar.currH, barWidth, bar.currH * 2, 4);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.width = canvasRef.current.offsetWidth;
        height = canvasRef.current.height = canvasRef.current.offsetHeight;
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [isPlaying, playbackSpeed, volumeBoost, metadata]);

  // Video and slider playback loop
  useEffect(() => {
    let playTimer: any;
    if (isPlaying) {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
      playTimer = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1 * playbackSpeed;
          if (next >= endTime) {
            if (videoRef.current) videoRef.current.currentTime = startTime;
            return startTime;
          }
          return next;
        });
      }, 100);
    } else {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      clearInterval(playTimer);
    }
    return () => clearInterval(playTimer);
  }, [isPlaying, startTime, endTime, playbackSpeed]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    const clickedTime = pct * metadata.duration;
    
    // Bind to boundaries
    if (clickedTime >= startTime && clickedTime <= endTime) {
      setCurrentTime(clickedTime);
      if (videoRef.current) {
        videoRef.current.currentTime = clickedTime;
      }
    }
  };

  const formatTimeStr = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const pctStart = (startTime / metadata.duration) * 100;
  const pctEnd = (endTime / metadata.duration) * 100;
  const pctCurrent = (currentTime / metadata.duration) * 100;

  return (
    <div className="flex flex-col gap-5 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xl backdrop-blur-md">
      {/* Visual Canvas Area */}
      <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-zinc-800 group shadow-inner">
        {metadata.type === "video" ? (
          <div className="w-full h-full relative">
            {/* Real HTML5 ambient looping presentation */}
            <video
              ref={videoRef}
              src="https://assets.mixkit.co/videos/preview/mixkit-glowing-digital-network-lines-background-42998-large.mp4"
              className="w-full h-full object-cover opacity-65"
              loop
              muted
              playsInline
            />
            {/* Absolute overlay elements */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800/80">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-mono text-zinc-300">STREAM RECOGNIZED - HD</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col justify-center items-center relative p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12)_0%,transparent_70%)]" />
            <div className="relative z-10 w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-500 shadow-2xl">
              <div className={`absolute inset-1 rounded-full border border-dashed border-indigo-500/30 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '20s' }} />
              <Activity className={`w-10 h-10 text-indigo-400 ${isPlaying ? 'opacity-100 scale-100' : 'opacity-40 scale-90'} transition-all`} />
            </div>
            <div className="mt-4 text-center z-10 max-w-sm">
              <span className="text-xs tracking-widest uppercase font-mono text-indigo-400">Audio Extracted Studio</span>
              <p className="text-sm font-medium text-zinc-300 truncate mt-1">{metadata.title}</p>
            </div>
          </div>
        )}

        {/* Unified Equalizer Wave Visual Overlay (bottom of player) */}
        <div className="absolute bottom-16 inset-x-5 h-12 pointer-events-none opacity-80">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Hover / Inactive Controls HUD */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-zinc-950/95 to-transparent px-4 py-3 flex items-center justify-between">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-white text-zinc-900 flex items-center justify-center transition-all hover:scale-105 shadow-md active:scale-95"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          <div className="flex items-center gap-3 font-mono text-xs text-zinc-300">
            <span>{formatTimeStr(currentTime)}</span>
            <span className="text-zinc-600">/</span>
            <span>{formatTimeStr(metadata.duration)}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded bg-zinc-950/80 border border-zinc-800 text-[10px] font-mono text-zinc-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-purple-400" />
              <span>CROP ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Wave Trimmer Timeline */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-zinc-400 flex items-center gap-1"><Scissors className="w-3.5 h-3.5" /> Selection Trimming Panel</span>
          <span className="text-indigo-400 font-medium">Cut Span: {formatTimeStr(startTime)} - {formatTimeStr(endTime)} ({(endTime - startTime).toFixed(0)}s)</span>
        </div>

        {/* Timeline Visual Track */}
        <div className="relative h-14 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden px-1 flex items-center select-none">
          {/* Mock waves in the background */}
          <div className="absolute inset-0 flex items-center justify-between px-3 gap-0.5 pointer-events-none opacity-20">
            {Array.from({ length: 60 }).map((_, i) => {
              const h = Math.abs(Math.sin(i * 0.15) * 40 * Math.cos(i * 0.05)) + 4;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-zinc-400"
                  style={{ height: `${h}%` }}
                />
              );
            })}
          </div>

          {/* Active Highlight Selection Range */}
          <div
            className="absolute h-full bg-indigo-500/10 border-x-2 border-indigo-500 flex justify-between items-center"
            style={{
              left: `${pctStart}%`,
              width: `${pctEnd - pctStart}%`,
            }}
          >
            {/* Range grab handles */}
            <div className="w-1 h-8 bg-indigo-400 rounded-full -ml-0.5 pointer-events-none" />
            <div className="w-1 h-8 bg-indigo-400 rounded-full -mr-0.5 pointer-events-none" />
          </div>

          {/* Current player pointer needle */}
          {isPlaying && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-purple-400 z-10 pointer-events-none shadow-[0_0_8px_#a855f7]"
              style={{ left: `${pctCurrent}%` }}
            />
          )}

          {/* Invisible interactive clicker layer */}
          <div className="absolute inset-0 cursor-crosshair z-0" onClick={handleTimelineClick} />
        </div>

        {/* Left and Right Manual Control Input Sliders */}
        <div className="grid grid-cols-2 gap-4 mt-1">
          <div className="flex flex-col gap-1 bg-zinc-950/40 p-2.5 border border-zinc-800/50 rounded-lg">
            <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">START BOUNDARY</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={Math.max(0, endTime - 5)} // Give at least 5s window
                step={1}
                value={startTime}
                onChange={(e) => setStartTime(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-zinc-800 cursor-ew-resize h-1 rounded"
              />
              <span className="font-mono text-xs font-semibold text-zinc-300 w-12 text-right">
                {formatTimeStr(startTime)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 bg-zinc-950/40 p-2.5 border border-zinc-800/50 rounded-lg">
            <label className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">END BOUNDARY</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={Math.min(metadata.duration, startTime + 5)}
                max={metadata.duration}
                step={1}
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-zinc-800 cursor-ew-resize h-1 rounded"
              />
              <span className="font-mono text-xs font-semibold text-zinc-300 w-12 text-right">
                {formatTimeStr(endTime)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
