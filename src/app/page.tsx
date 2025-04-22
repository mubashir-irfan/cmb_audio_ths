"use client";

import React, { useRef, useState, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js";

export default function AudioPage() {
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [wavesurfers, setWavesurfers] = useState<WaveSurfer[]>([]);
  const [readyStates, setReadyStates] = useState<boolean[]>([]);
  const [durations, setDurations] = useState<number[]>([]);
  const [longestDuration, setLongestDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up all WaveSurfer instances on unmount or file change
  useEffect(() => {
    return () => {
      wavesurfers.forEach(ws => ws && ws.destroy());
    };
  }, [wavesurfers]);

  // Create WaveSurfer instances for all audio files
  useEffect(() => {
    // Destroy previous instances
    wavesurfers.forEach(ws => ws && ws.destroy());
    const newWavesurfers: WaveSurfer[] = [];
    const newReadyStates: boolean[] = [];
    const newDurations: number[] = [];
    audioFiles.forEach((file, idx) => {
      if (!containerRefs.current[idx] || !timelineRef.current) return;
      const ws = WaveSurfer.create({
        container: containerRefs.current[idx],
        waveColor: "#888",
        progressColor: "#a855f7",
        cursorColor: "#fff",
        barWidth: 2,
        height: 100,
        normalize: true,
        backend: "MediaElement",
        plugins: idx === 0 ? [TimelinePlugin.create({ container: timelineRef.current, height: 20 })] : [],
      });
      ws.load(URL.createObjectURL(file));
      ws.on("ready", () => {
        newReadyStates[idx] = true;
        newDurations[idx] = ws.getDuration();
        setReadyStates([...newReadyStates]);
        setDurations([...newDurations]);
      });
      ws.on("finish", () => setIsPlaying(false));
      newWavesurfers[idx] = ws;
    });
    setWavesurfers(newWavesurfers);
    setReadyStates(Array(audioFiles.length).fill(false));
    setDurations(Array(audioFiles.length).fill(0));
    // eslint-disable-next-line
  }, [audioFiles]);

  // Update longest duration when durations change
  useEffect(() => {
    if (durations.length > 0) {
      setLongestDuration(Math.max(...durations));
    } else {
      setLongestDuration(0);
    }
  }, [durations]);

  // Play/pause all tracks
  const togglePlay = () => {
    if (wavesurfers.length === 0 || readyStates.some(r => !r)) return;
    if (isPlaying) {
      wavesurfers.forEach(ws => ws && ws.pause());
      setIsPlaying(false);
    } else {
      // Sync all to 0 or to the min currentTime
      const minTime = Math.min(...wavesurfers.map(ws => ws.getCurrentTime()));
      wavesurfers.forEach(ws => ws && ws.setTime(minTime));
      wavesurfers.forEach(ws => ws && ws.play());
      setIsPlaying(true);
    }
  };

  // File select handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      setAudioFiles(prev => [...prev, ...files]);
    }
  };

  // Render stacked waveform containers
  const renderWaveforms = () =>
    audioFiles.map((file, idx) => (
      <div key={idx} style={{ position: "relative", width: "100%", height: 100, marginBottom: 8, background: "#181818", borderRadius: 8, overflow: "hidden" }}>
        <div
          ref={el => {
            containerRefs.current[idx] = el;
            return undefined;
          }}
          className="w-full h-full"
          style={{ width: durations[idx] && longestDuration ? `${(durations[idx] / longestDuration) * 100}%` : "100%", height: "100%", position: "absolute", left: 0, top: 0 }}
        />
        <div style={{ position: "absolute", left: 8, top: 8, color: "#ccc", fontSize: 12, background: "#222", borderRadius: 4, padding: "2px 8px", zIndex: 2 }}>{file.name}</div>
      </div>
    ));

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="flex flex-col gap-2 text-2xl font-semibold mb-4 text-center">
        <span>Multi-Track Audio Player</span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-700 transition"
      >
        Upload Audio(s)
      </button>
      <div className="mt-6 w-full max-w-[80%] flex flex-col gap-2">
        <div
          ref={timelineRef}
          className="w-full text-sm text-gray-300 mb-2"
        />
        {renderWaveforms()}
        {audioFiles.length > 0 && (
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