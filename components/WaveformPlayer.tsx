
import React, { useEffect, useRef, useState } from 'react';
import { Track } from '../types';
import { Play, Pause, SkipForward, SkipBack, Loader2, Volume2, Volume1, VolumeX } from 'lucide-react';

interface WaveformPlayerProps {
  selectedTrack: Track;
  playingTrackId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlay: (id: string) => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (val: number) => void;
}

const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  selectedTrack,
  playingTrackId,
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlay,
  onPause,
  onSeek,
  onNext,
  onPrevious,
  onVolumeChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);

  const isCurrentTrackPlaying = playingTrackId === selectedTrack.id;

  // 1. Decode Audio Data for Waveform
  useEffect(() => {
    let active = true;
    
    const decodeAudio = async () => {
      if (!selectedTrack.audioUrl) {
        setAudioBuffer(null);
        return;
      }

      // Check if we already have this buffer cached in a real app, 
      // but here we decode on change.
      setIsDecoding(true);
      setAudioBuffer(null);

      try {
        // Fetch the base64/blob
        const response = await fetch(selectedTrack.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        // Decode
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        
        if (active) {
          setAudioBuffer(decoded);
        }
      } catch (e) {
        console.error("Error decoding audio for waveform", e);
      } finally {
        if (active) setIsDecoding(false);
      }
    };

    decodeAudio();

    return () => { active = false; };
  }, [selectedTrack.id, selectedTrack.audioUrl]);

  // 2. Draw Waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Draw Logic
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.beginPath();
    ctx.moveTo(0, amp);

    // Styling
    // If this track is playing, we draw progress.
    // If not, we just draw the whole waveform in a neutral gold.
    
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      // Draw a bar for this pixel column
      const x = i;
      const yMin = (1 + min) * amp;
      const yMax = (1 + max) * amp;
      
      // Progress Coloring
      const progressPercent = isCurrentTrackPlaying ? (currentTime / duration) : 0;
      const isPlayed = (i / width) < progressPercent;

      if (isCurrentTrackPlaying) {
          ctx.fillStyle = isPlayed ? '#fbbf24' : '#451a03'; // Amber-400 vs Amber-950
      } else {
          ctx.fillStyle = '#78350f'; // Amber-900 (Inactive)
      }
      
      // Draw Rect (Bar)
      const barHeight = Math.max(1, yMax - yMin);
      ctx.fillRect(x, height / 2 - barHeight / 2, 1, barHeight);
    }
    
    // Draw Scrubber / Playhead
    if (isCurrentTrackPlaying) {
        const playheadX = (currentTime / duration) * width;
        ctx.fillStyle = '#fff';
        ctx.fillRect(playheadX, 0, 2, height);
        
        // Glow
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
        ctx.shadowBlur = 0; // Reset
    }

  }, [audioBuffer, currentTime, duration, isCurrentTrackPlaying]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioBuffer || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPercent = x / rect.width;
    
    const newTime = clickPercent * audioBuffer.duration;
    
    if (isCurrentTrackPlaying) {
        onSeek(newTime);
    } else {
        onPlay(selectedTrack.id);
    }
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="fixed bottom-0 left-0 lg:left-64 right-0 h-24 bg-slate-950/95 border-t border-amber-500/30 backdrop-blur-xl flex items-center px-6 z-40 shadow-[0_-5px_30px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-full duration-500">
      
      {/* Controls */}
      <div className="flex items-center gap-4 mr-6 shrink-0">
        <button 
          onClick={onPrevious}
          className="text-slate-500 hover:text-amber-500 transition-colors"
          title="Previous Track"
        >
            <SkipBack size={20} />
        </button>
        
        <button 
            onClick={() => isCurrentTrackPlaying && isPlaying ? onPause() : onPlay(selectedTrack.id)}
            className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95"
        >
            {isCurrentTrackPlaying && isPlaying ? (
                <Pause size={20} fill="currentColor" />
            ) : (
                <Play size={20} fill="currentColor" className="ml-1" />
            )}
        </button>

        <button 
          onClick={onNext}
          className="text-slate-500 hover:text-amber-500 transition-colors"
          title="Next Track"
        >
            <SkipForward size={20} />
        </button>
      </div>

      {/* Info */}
      <div className="w-48 mr-6 shrink-0 hidden md:block">
        <h3 className="text-slate-200 font-medium truncate text-sm">{selectedTrack.title}</h3>
        <p className="text-amber-500/70 text-xs truncate font-mono mt-0.5">
            {isCurrentTrackPlaying ? (
                <span>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>
            ) : (
                "Preview Selection"
            )}
        </p>
      </div>

      {/* Waveform Canvas */}
      <div className="flex-1 h-full relative group flex items-center justify-center">
        {isDecoding ? (
            <div className="flex items-center gap-2 text-amber-500/50 text-xs uppercase tracking-widest">
                <Loader2 className="animate-spin w-4 h-4" /> Analyzing Waveform...
            </div>
        ) : (
            <canvas 
                ref={canvasRef}
                width={800}
                height={64}
                onClick={handleCanvasClick}
                className="w-full h-16 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
            />
        )}
      </div>
      
      {/* Volume Control */}
      <div className="ml-6 shrink-0 text-slate-500 group relative flex items-center h-full">
         <div className="w-0 overflow-hidden group-hover:w-24 transition-all duration-300 ease-out flex items-center pr-2">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500" 
            />
         </div>
         <button 
           onClick={() => onVolumeChange(volume === 0 ? 1 : 0)}
           className="hover:text-amber-500 transition-colors p-2"
         >
            <VolumeIcon size={20} />
         </button>
      </div>

    </div>
  );
};

const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default WaveformPlayer;
