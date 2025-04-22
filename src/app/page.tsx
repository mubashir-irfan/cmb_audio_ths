'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js'

export default function AudioPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1)

  useEffect(() => {
    if (!audioFile || !containerRef.current) return;

    const url = URL.createObjectURL(audioFile);

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    wavesurferRef.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#888',
      progressColor: '#a855f7',
      cursorColor: '#fff',
      barWidth: 2,
      height: 100,
      normalize: true,
      backend: 'MediaElement',
      plugins: [
        TimelinePlugin.create({
          container: timelineRef.current!,
          height: 20,
          insertPosition: 'afterend', // place it below the waveform
          timeInterval: 1,
          primaryLabelInterval: 10,
          secondaryLabelInterval: 10,
          style: {
            color: '#ccc',
            fontSize: '12px',
            padding: '4px',
          },
          secondaryLabelOpacity: 0,
          formatTimeCallback: (s) => {
            const minutes = Math.floor(s / 60);
            const seconds = Math.floor(s % 60).toString().padStart(2, '0');
            return `${minutes}:${seconds}`;
          },
        }),
      ],
    });

    wavesurferRef.current.load(url);
    wavesurferRef.current.on('finish', () => setIsPlaying(false));

    return () => {
      wavesurferRef.current?.destroy();
    };
  }, [audioFile]);

  const togglePlay = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.playPause();
    setIsPlaying((prev) => !prev);
  };

  const clearTrack = () => {
    wavesurferRef.current?.stop();
    wavesurferRef.current?.destroy();
    wavesurferRef.current = null;
    setAudioFile(null);
    setIsPlaying(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="flex flex-col gap-2 text-2xl font-semibold mb-4 text-center">
        <p className='text-5xl'>🎵</p>
        <h1>Inspired Audio Player</h1></div>

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

      <div className="mt-6 w-full max-w-[80%] cursor-pointer">
        <div ref={containerRef} className="w-full bg-[#1a1a1a] rounded" />
        <div ref={timelineRef} className="w-full text-sm text-gray-300" />
        {audioFile && <div className="flex items-center gap-4 mt-6 px-4 max-w-[60%] mx-auto">
          <label htmlFor="zoom" className="text-sm text-gray-300 whitespace-nowrap">Zoom</label>
          <input
            id="zoom"
            type="range"
            min="1"
            max="200"
            value={zoomLevel}
            onChange={(e) => {
              const zoom = Number(e.target.value)
              setZoomLevel(zoom)
              wavesurferRef.current?.zoom(zoom)
            }}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-sm text-gray-400 w-10 text-right">{zoomLevel}</span>
        </div>}

        {audioFile && (
          <div className="flex flex-col space-y-4 items-center mt-4">
            <button
              onClick={togglePlay}
              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <button
              onClick={clearTrack}
              className="cursor-pointer bg-transparent text-sm text-red-400 hover:text-red-700 underline transition"
            >
              Clear Tracks
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
