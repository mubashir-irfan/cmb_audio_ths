'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';

export default function AudioPage() {
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wavesurferRefs = useRef<(WaveSurfer | null)[]>([]);

  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [timelineDuration, setTimelineDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [allReady, setAllReady] = useState(false);
  const [readyStates, setReadyStates] = useState<boolean[]>([]);
  const [durations, setDurations] = useState<number[]>([]);

  // Helper to (re)create a single WaveSurfer instance
  const createWaveSurfer = (idx: number, audioFile: File, timeline: boolean) => {
    const url = URL.createObjectURL(audioFile);
    const ws = WaveSurfer.create({
      container: containerRefs.current[idx]!,
      waveColor: '#888',
      progressColor: '#a855f7',
      cursorColor: 'transparent',
      interact: false,
      cursorWidth: 2,
      barWidth: 2,
      height: 100,
      normalize: true,
      backend: 'MediaElement',
      plugins: timeline ? [
        TimelinePlugin.create({
          container: timelineRef.current!,
          duration: timelineDuration,
          height: 20,
          insertPosition: 'afterend',
          timeInterval: 1,
          primaryLabelInterval: 10,
          secondaryLabelInterval: 10,
          style: {
            color: '#ccc',
            fontSize: '12px',
            padding: '4px',
          },
          secondaryLabelOpacity: 0,
          formatTimeCallback: (s: number) => {
            const minutes = Math.floor(s / 60);
            const seconds = Math.floor(s % 60).toString().padStart(2, '0');
            return `${minutes}:${seconds}`;
          },
        })
      ] : [],
    });
    ws.load(url);
    ws.on('ready', () => {
      ws.zoom(zoomLevel);
      setReadyStates(prev => {
        const arr = [...prev];
        arr[idx] = true;
        return arr;
      });
      setDurations(prev => {
        const arr = [...prev];
        arr[idx] = ws.getDuration();
        return arr;
      });
    });
    ws.on('finish', () => setIsPlaying(false));
    wavesurferRefs.current[idx] = ws;
    return ws;
  };

  useEffect(() => {
    // Destroy all instances first
    wavesurferRefs.current.forEach(w => w?.destroy());
    wavesurferRefs.current = [];
    audioFiles.forEach((audioFile, idx) => {
      createWaveSurfer(idx, audioFile, idx === 0);
    });
  }, [audioFiles]);

  useEffect(() => {
    setReadyStates(audioFiles.map(() => false));
    setDurations(audioFiles.map(() => 0));
    setAllReady(false);
  }, [audioFiles]);

  useEffect(() => {
    if (readyStates.length && readyStates.every(Boolean)) setAllReady(true);
    // Update timelineDuration when all tracks are ready
    if (durations.length && readyStates.every(Boolean)) {
      setTimelineDuration(Math.max(...durations));
    }
  }, [readyStates, durations]);

  useEffect(() => {
    wavesurferRefs.current.forEach(ws => ws?.zoom(zoomLevel));
  }, [zoomLevel]);

  // Re-create master waveform if timelineDuration changes
  useEffect(() => {
    if (!audioFiles.length || !containerRefs.current[0]) return;
    // Destroy and re-create master waveform
    if (wavesurferRefs.current[0]) {
      wavesurferRefs.current[0].destroy();
    }
    createWaveSurfer(0, audioFiles[0], true);
  }, [timelineDuration]);

  useEffect(() => {
    let raf: number | null = null;
    const update = () => {
      const t = wavesurferRefs.current[0]?.getCurrentTime() || 0;
      setCurrentTime(t);
      raf = requestAnimationFrame(update);
    };
    if (isPlaying) raf = requestAnimationFrame(update);
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    if (wavesurferRefs.current.length === 0) return;
    const anyPlaying = wavesurferRefs.current.some(ws => ws?.isPlaying());
    if (anyPlaying) {
      wavesurferRefs.current.forEach(ws => ws?.pause());
      setIsPlaying(false);
    } else {
      const currentTime = wavesurferRefs.current[0]?.getCurrentTime() || 0;
      await Promise.all(wavesurferRefs.current.map(ws => ws && ws.setTime(currentTime)));
      setTimeout(() => {
        wavesurferRefs.current.forEach(ws => ws?.play());
        setIsPlaying(true);
      }, 10);
    }
  };

  const clearTracks = () => {
    wavesurferRefs.current.forEach(ws => ws?.stop());
    wavesurferRefs.current.forEach(ws => ws?.destroy());
    wavesurferRefs.current = [];
    setAudioFiles([]);
    setIsPlaying(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      setAudioFiles(prev => [...prev, ...files]);
    }
  };

  const handleSeek = (progress: number) => {
    if (!allReady) return;
    const seekTime = timelineDuration * progress;
    wavesurferRefs.current.forEach((ws, idx) => {
      if (ws) ws.setTime(Math.min(seekTime, durations[idx]));
    });
    setCurrentTime(seekTime);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-gray-100 flex flex-col items-center justify-center p-6">
      <div className="flex flex-col gap-2 text-2xl font-semibold mb-4 text-center">
        <p className="text-5xl">🎵</p>
        <h1>Multi-Track Audio Composer</h1>
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
        Upload Track(s)
      </button>

      <div className="mt-6 w-full max-w-[80%] cursor-pointer flex flex-col gap-2">
        {/* Shared timeline at top */}
        <div ref={timelineRef} className="w-full text-sm text-gray-300 mb-2" />
        {/* Stacked waveforms in a single container */}
        <div className="relative w-full flex flex-col" style={{gap: 0, background: '#181818', borderRadius: 8, overflow: 'hidden'}}>
          {/* Loading overlay */}
          {!allReady && (
            <div style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',zIndex:100,background:'rgba(30,30,30,0.7)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:24}}>
              Loading tracks...
            </div>
          )}
          {/* Global cursor overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${timelineDuration ? (currentTime / timelineDuration) * 100 : 0}%`,
              width: 2,
              height: '100%',
              background: '#fff',
              zIndex: 10,
              pointerEvents: 'none',
              transition: 'left 0.02s linear',
            }}
          />
          {audioFiles.map((audioFile, idx) => (
            <div key={idx} style={{height: 100, width: '100%', position: 'relative', display: 'flex', flexDirection: 'row'}}>
              {/* Waveform: proportional width */}
              <div
                ref={el => { containerRefs.current[idx] = el; }}
                className="absolute left-0 top-0 h-full"
                style={{
                  width: durations[idx] && timelineDuration ? `${(durations[idx] / timelineDuration) * 100}%` : '0%',
                  pointerEvents: 'auto',
                  position: 'relative',
                  zIndex: 1,
                }}
              />
              {/* Silent region: fill the rest */}
              {durations[idx] < timelineDuration && (
                <div
                  style={{
                    width: `${100 - (durations[idx] / timelineDuration) * 100}%`,
                    height: '100%',
                    background: 'rgba(80,80,80,0.15)',
                    position: 'relative',
                    zIndex: 0,
                  }}
                />
              )}
              <div className="absolute left-2 top-2 text-xs text-gray-400 truncate bg-[#222] bg-opacity-70 px-2 rounded" style={{zIndex: 2}}>{audioFile.name}</div>
            </div>
          ))}
          {/* Overlay for seeking: click/drag to seek */}
          <div
            style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 20, cursor: 'pointer'}}
            onClick={e => {
              const rect = (e.target as HTMLDivElement).getBoundingClientRect();
              const x = e.clientX - rect.left;
              const progress = x / rect.width;
              handleSeek(progress);
            }}
          />
        </div>
        {audioFiles.length > 0 && (
          <div className="flex items-center gap-4 mt-4 px-4 max-w-[60%] mx-auto">
            <label htmlFor="zoom" className="text-sm text-gray-300 whitespace-nowrap">Zoom</label>
            <input
              id="zoom"
              type="range"
              min="1"
              max="200"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <span className="text-sm text-gray-400 w-10 text-right">{zoomLevel}</span>
          </div>
        )}
        {audioFiles.length > 0 && (
          <div className="flex flex-col space-y-4 items-center mt-4">
            <button
              onClick={togglePlay}
              className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={clearTracks}
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
