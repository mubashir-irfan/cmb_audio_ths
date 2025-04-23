"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline";

export default function AudioPage() {
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [waveSurfers, setWaveSurfers] = useState<WaveSurfer[]>([]);
  const [cursorX, setCursorX] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const waveformContainerRefs = useRef<HTMLDivElement[]>([]);

  const setWaveformRef = (el: HTMLDivElement | null, index: number) => {
    if (el) waveformContainerRefs.current[index] = el;
  };

  useEffect(() => {
    waveSurfers.forEach((ws) => ws.destroy());

    const newWaveSurfers = audioFiles.map((file, index) => {
      const url = URL.createObjectURL(file);
      const container = waveformContainerRefs.current[index];

      const ws = WaveSurfer.create({
        container,
        waveColor: "#888",
        progressColor: "#a855f7",
        cursorColor: "transparent",
        barWidth: 2,
        height: 100,
        backend: "MediaElement",
        plugins: index === 0 && timelineContainerRef.current
          ? [
            TimelinePlugin.create({
              container: timelineContainerRef.current,
              timeInterval: 10,
              primaryLabelInterval: 1,
              secondaryLabelInterval: 5,
            }),
          ]
          : [],
      });

      ws.load(url);

      ws.on("audioprocess", (currentTime) => {
        const longest = getLongestAudioDuration(newWaveSurfers);
        const width = waveformContainerRefs.current[0]?.offsetWidth || 0;
        const x = (currentTime / longest) * width;
        setCursorX(x);
      });

      ws.on("interaction", (newTime) => {
        const longest = getLongestAudioDuration(newWaveSurfers);
        const width = waveformContainerRefs.current[0]?.offsetWidth || 0;
        const x = (newTime / longest) * width;
        setCursorX(x);

        newWaveSurfers.forEach((w) => {
          const target = Math.min(w.getDuration(), newTime);
          w.seekTo(target / w.getDuration());
        });
      });

      return ws;
    });

    setWaveSurfers(newWaveSurfers);

    if (newWaveSurfers.length > 0 && waveformContainerRefs.current[0]) {
      const longest = getLongestAudioDuration(newWaveSurfers);
      const timelineWidth = waveformContainerRefs.current[0].offsetWidth;

      newWaveSurfers.forEach((ws, i) => {
        ws.on("ready", () => {
          const duration = ws.getDuration();
          const width = (duration / longest) * timelineWidth;
          if (waveformContainerRefs.current[i]) {
            waveformContainerRefs.current[i].style.width = `${width}px`;
          }
        });
      });
    }

    return () => newWaveSurfers.forEach((ws) => ws.destroy());
  }, [audioFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioFiles((prev) => [...prev, file]);
  };

  const togglePlay = () => {
    if (waveSurfers.length === 0) return;
    waveSurfers.forEach((ws) => (isPlaying ? ws.pause() : ws.play()));
    setIsPlaying(!isPlaying);
  };

  const clearTracks = () => {
    waveSurfers.forEach((ws) => ws.destroy());
    setWaveSurfers([]);
    setAudioFiles([]);
    setIsPlaying(false);
    setCursorX(0);
  };

  const getLongestAudioDuration = (wavesurfers: WaveSurfer[]) => {
    if (wavesurfers.length === 0) return 0;
    return Math.max(...wavesurfers.map((ws) => ws.getDuration()));
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 flex flex-col items-center justify-center p-6 no-scrollbar">
      <div className="flex flex-col gap-2 text-2xl font-semibold mb-4 text-center">
        <p className="text-5xl">🎵</p>
        <h1>Multi-track Audio Player</h1>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
      >
        Upload Track
      </button>

      <div className="mt-6 w-full max-w-[80%] cursor-pointer space-y-6 no-scrollbar">
        {audioFiles.map((_, index) => (
          <div key={index} className="relative w-full rounded overflow-x-scroll no-scrollbar">
            <div ref={(el) => setWaveformRef(el, index)} className="w-full" />
            <div
              className="absolute top-0 bottom-0 w-[3px] bg-green-500 pointer-events-none z-10"
              style={{ left: `${cursorX}px` }}
            />
          </div>
        ))}

        {/* Shared timeline */}
        <div ref={timelineContainerRef} className="w-full h-[20px] relative text-sm text-gray-300 mt-4" />

        {audioFiles.length > 0 && (
          <>
            <div className="flex flex-col space-y-4 items-center mt-4">
              <button
                onClick={togglePlay}
                className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>

              <button
                onClick={clearTracks}
                className="cursor-pointer bg-transparent text-sm text-red-400 hover:text-red-700 underline transition"
              >
                Clear Tracks
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}