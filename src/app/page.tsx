"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";

export default function AudioPage() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [waveSurfers, setWaveSurfers] = useState<WaveSurfer[]>([]);
  const [cursorX, setCursorX] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const waveformContainerRefs = useRef<HTMLDivElement[]>([]);

  // Refs initializer for dynamic waveform containers
  const setWaveformRef = (el: HTMLDivElement | null, index: number) => {
    if (el) waveformContainerRefs.current[index] = el;
  };

  useEffect(() => {
    // Cleanup previous wavesurfer instances
    waveSurfers.forEach((ws) => ws.destroy());

    const newWaveSurfers = audioFiles.map((file, index) => {
      const url = URL.createObjectURL(file);

      const wavesurfer = WaveSurfer.create({
        container: waveformContainerRefs.current[index],
        waveColor: "#888",
        progressColor: "#a855f7",
        cursorColor: "transparent",
        barWidth: 2,
        height: 100,
        normalize: true,
        backend: "MediaElement",
      });

      wavesurfer.load(url);

      // Update cursor during playback
      wavesurfer.on("audioprocess", (currentTime: number) => {
        const longestDuration = Math.max(...newWaveSurfers.map((ws) => ws.getDuration()));
        const width = waveformContainerRefs.current[0].offsetWidth;
        const x = (currentTime / longestDuration) * width;
        setCursorX(x);
      });

      // Sync seek on interaction
      wavesurfer.on("interaction", (newTime: number) => {
        const longestDuration = Math.max(...newWaveSurfers.map((ws) => ws.getDuration()));
        const width = waveformContainerRefs.current[0].offsetWidth;
        const x = (newTime / longestDuration) * width;
        setCursorX(x);
        newWaveSurfers.forEach((ws) => {
          const targetTime = Math.min(ws.getDuration(), newTime);
          ws.seekTo(targetTime / ws.getDuration());
        });
      });

      return wavesurfer;
    });

    // Timeline only on first waveform
    if (timelineRef.current && waveformContainerRefs.current[0]) {
      newWaveSurfers[0].registerPlugin(
        TimelinePlugin.create({
          container: timelineRef.current,
          height: 20,
          insertPosition: "afterend",
          timeInterval: 1,
          primaryLabelInterval: 10,
          secondaryLabelInterval: 10,
          style: {
            color: "#ccc",
            fontSize: "12px",
            padding: "4px",
          },
          secondaryLabelOpacity: 0,
          formatTimeCallback: (s) => {
            const minutes = Math.floor(s / 60);
            const seconds = Math.floor(s % 60)
              .toString()
              .padStart(2, "0");
            return `${minutes}:${seconds}`;
          },
        })
      );
    }

    setWaveSurfers(newWaveSurfers);

    return () => newWaveSurfers.forEach((ws) => ws.destroy());
  }, [audioFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFiles((prev) => [...prev, file]);
    }
  };

  const togglePlay = () => {
    if (waveSurfers.length === 0) return;
    waveSurfers.forEach((ws) => {
      if (isPlaying) ws.pause();
      else ws.play();
    });
    setIsPlaying(!isPlaying);
  };

  const clearTracks = () => {
    waveSurfers.forEach((ws) => ws.destroy());
    setWaveSurfers([]);
    setAudioFiles([]);
    setIsPlaying(false);
    setCursorX(0);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 flex flex-col items-center justify-center p-6">
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

      <div className="mt-6 w-full max-w-[80%] cursor-pointer space-y-6">
        {audioFiles.map((_, index) => (
          <div key={index} className="relative w-full bg-[#1a1a1a] rounded">
            <div ref={(el) => setWaveformRef(el, index)} className="w-full" />
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-green-500 pointer-events-none"
              style={{ left: `${cursorX}px` }}
            />
          </div>
        ))}

        <div ref={timelineRef} className="w-full text-sm text-gray-300" />

        {audioFiles.length > 0 && (
          <>
            <div className="flex items-center gap-4 mt-6 px-4 max-w-[60%] mx-auto">
              <label htmlFor="zoom" className="text-sm text-gray-300 whitespace-nowrap">
                Zoom
              </label>
              <input
                id="zoom"
                type="range"
                min="1"
                max="200"
                value={zoomLevel}
                onChange={(e) => {
                  const zoom = Number(e.target.value);
                  setZoomLevel(zoom);
                  waveSurfers.forEach((ws) => ws.zoom(zoom));
                }}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="text-sm text-gray-400 w-10 text-right">{zoomLevel}</span>
            </div>

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
