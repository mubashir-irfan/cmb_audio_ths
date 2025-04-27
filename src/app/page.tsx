'use client';

import { useEffect, useRef, useState } from 'react';

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [cursorPosition, setCursorPosition] = useState<number>(0); // 0 to 1 (percentage)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);

    const audio = document.createElement('audio');
    audio.src = URL.createObjectURL(file);

    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };
  };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.min(Math.max(clickX / rect.width, 0), 1);

    setCursorPosition(percentage);
  };

  // Dynamically generate timeline ticks
  const generateTicks = () => {
    const ticks = [];
    for (let time = 0; time <= audioDuration; time += 5) {
      ticks.push(time);
    }
    return ticks;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-start p-8 gap-8">
      <h1 className="text-2xl font-semibold">Custom Audio Player</h1>

      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="bg-gray-800 p-2 rounded"
      />

      {audioFile && (
        <div className="flex flex-col items-center gap-4 w-full max-w-3xl mt-8">
          {/* Container with Cursor */}
          <div
            ref={containerRef}
            onClick={handleContainerClick}
            className="relative w-full h-32 bg-gray-800 rounded-md cursor-pointer overflow-hidden"
          >
            {/* Cursor */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-red-500"
              style={{
                left: `${cursorPosition * 100}%`,
                transform: 'translateX(-50%)',
              }}
            />
          </div>

          {/* Timeline */}
          <div className="relative w-full h-10 mt-2">
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
