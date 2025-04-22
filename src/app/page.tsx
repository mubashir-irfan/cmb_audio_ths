'use client';

import { useRef, useState } from 'react';

export default function Page() {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    setProgress((current / duration) * 100);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-semibold mb-4">🎵 Audio Player</h1>

      <input
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="file:bg-gray-800 file:text-gray-100 file:border-none file:px-4 file:py-2 file:rounded file:cursor-pointer"
      />

      {audioSrc && (
        <div className="mt-6 w-full max-w-xl">
          <audio
            ref={audioRef}
            src={audioSrc}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />

          <div className="flex items-center space-x-4 mt-4">
            <button
              onClick={togglePlay}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <div className="flex-1 h-2 bg-gray-700 rounded overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
