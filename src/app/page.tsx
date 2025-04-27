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
          <div ref={timelineRef} className="relative w-full h-12 mt-2">
            <div className="w-full h-1 bg-gradient-to-r from-teal-600 via-teal-500 to-teal-600 rounded-full shadow-lg">
              {/* Timeline ticks */}
              {generateTicks().map((time, index) => {
                const isPrimary = time % 30 === 0;
                const isSecondary = time % 15 === 0;
                return (
                  <div
                    key={index}
                    className={`absolute transition-transform duration-150 hover:scale-110 group ${
                      isPrimary ? 'z-20' : isSecondary ? 'z-10' : 'z-0'
                    }`}
                    style={{
                      left: `${(time / audioDuration) * 100}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {/* Tick line */}
                    <div
                      className={`
                        ${isPrimary 
                          ? 'h-6 w-0.5 bg-teal-300' 
                          : isSecondary 
                            ? 'h-4 w-px bg-teal-400/70'
                            : 'h-2 w-px bg-teal-400/50'
                        }
                        transition-all duration-150
                        group-hover:bg-teal-200
                      `}
                    />
                    {/* Time label */}
                    {(isPrimary || isSecondary) && (
                      <div className={`
                        text-xs font-medium mt-1 text-center
                        transition-all duration-150
                        ${isPrimary 
                          ? 'text-teal-300' 
                          : 'text-teal-400/70 text-[0.65rem]'
                        }
                        group-hover:text-teal-200
                      `}>
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
