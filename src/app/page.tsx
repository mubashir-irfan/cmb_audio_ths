"use client";

import React, { useRef, useState, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";

export default function AudioPage() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // Clean up WaveSurfer on unmount or file change
  useEffect(() => {
    return () => {
      wavesurfer?.destroy();
    };
  }, [wavesurfer]);

  // Create WaveSurfer instance
  useEffect(() => {
    if (!audioFile || !containerRef.current || !timelineRef.current) return;
    if (wavesurfer) wavesurfer.destroy();
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#888",
      progressColor: "#a855f7",
      cursorColor: "#fff",
      barWidth: 2,
      height: 100,
      normalize: true,
      backend: "MediaElement",
      plugins: [TimelinePlugin.create({ container: timelineRef.current, height: 20 })],
    });
    ws.load(URL.createObjectURL(audioFile));
    ws.on("ready", () => setReady(true));
    ws.on("finish", () => setIsPlaying(false));
    setWavesurfer(ws);
    setReady(false);
    return () => {
      ws.destroy();
    };
  }, [audioFile, containerRef.current, timelineRef.current]);

  // Play/pause logic
  const togglePlay = () => {
    if (!wavesurfer || !ready) return;
    if (wavesurfer.isPlaying()) {
      wavesurfer.pause();
      setIsPlaying(false);
    } else {
      wavesurfer.play();
      setIsPlaying(true);
    }
  };

  // File select handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioFile(file);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="flex flex-col gap-2 text-2xl font-semibold mb-4 text-center">
        <span>Basic Audio Player</span>
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
        Upload Audio
      </button>
      <div className="mt-6 w-full max-w-[80%] flex flex-col gap-2">
        <div
          ref={timelineRef}
          className="w-full text-sm text-gray-300 mb-2"
        />
        <div
          ref={containerRef}
          className="relative w-full"
          style={{ background: "#181818", borderRadius: 8, overflow: "hidden", height: 100 }}
        />
        {audioFile && (
          <div className="flex flex-col space-y-4 items-center mt-4">
            <button
              onClick={togglePlay}
              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}