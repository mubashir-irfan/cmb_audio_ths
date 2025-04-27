'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
  };

  const handlePlayPause = () => {
    if (!wavesurferRef.current) return;
    wavesurferRef.current.playPause();
    setIsPlaying((prev) => !prev);
  };

  // Initialize wavesurfer when file changes
  useEffect(() => {
    if (!audioFile || !containerRef.current) return;

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
    }

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#6ee7b7', // teal-300
      progressColor: '#14b8a6', // teal-500
      cursorColor: 'red',
      barWidth: 2,
      height: 128,
      normalize: true,
    });

    wavesurfer.loadBlob(audioFile);

    wavesurfer.on('ready', () => {
      setAudioDuration(wavesurfer.getDuration());
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
    });

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [audioFile]);

  // Generate timeline ticks
  const generateTicks = () => {
    const ticks = [];
    for (let time = 0; time <= audioDuration; time += 5) {
      ticks.push(time);
    }
    return ticks;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-start p-8 gap-8">
      <h1 className="text-2xl font-semibold">Custom Audio Editor</h1>

      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="bg-gray-800 p-2 rounded"
      />

      {audioFile && (
        <div className="flex flex-col items-center gap-6 w-full max-w-4xl mt-8">
          {/* Waveform container */}
          <div
            ref={containerRef}
            className="w-full h-32 bg-gray-800 rounded-md overflow-hidden"
          />

          {/* Timeline */}
          <div ref={timelineRef} className="relative w-full h-10 mt-2">
            <div className="w-full h-1 bg-gray-600 rounded relative">
              {/* Timeline ticks */}
              {generateTicks().map((time, index) => {
                const isPrimary = time % 30 === 0;
                return (
                  <div
                    key={index}
                    className="absolute"
                    style={{
                      left: `${(time / audioDuration) * 100}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {/* Tick line */}
                    <div
                      className={`bg-gray-300 ${isPrimary ? 'h-6 w-0.5' : 'h-3 w-px'
                        }`}
                    />
                    {/* Time label */}
                    {isPrimary && (
                      <div className="text-xs text-gray-400 mt-1 text-center">
                        {formatTime(time)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            className="bg-teal-500 hover:bg-teal-400 text-black font-bold py-2 px-6 rounded"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        </div>
      )}
    </div>
  );
}

// Helper to format seconds into MM:SS
function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
