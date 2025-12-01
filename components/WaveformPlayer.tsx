
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
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);

  const isCurrentTrackPlaying = playingTrackId === selectedTrack.id;

  // 1. Decode Audio Data & Calculate Peaks
  useEffect(() => {
    let active = true;
    
    const decodeAudio = async () => {
      if (!selectedTrack.audioUrl) {
        setAudioBuffer(null);
        setPeaks(null);
        return;
      }

      setIsDecoding(true);
      setAudioBuffer(null);
      setPeaks(null);

      try {
        // Fetch
        const response = await fetch(selectedTrack.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        // Decode
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decoded = await audioCtx.decodeAudioData(arrayBuffer);
        
        if (active) {
          setAudioBuffer(decoded);

          // --- Pre-calculate Peaks for Performance ---
          // Instead of processing the whole buffer every frame, we condense it to fit the canvas width (800px)
          const channelData = decoded.getChannelData(0);
          const canvasWidth = 800;
          const step = Math.ceil(channelData.length / canvasWidth);
          const calculatedPeaks = [];

          for (let i = 0; i < canvasWidth; i++) {
            let max = 0;
            const start = i * step;
            // Scan the chunk for the max amplitude
            // Optimization: Don't scan past end
            const end = Math.min(start + step, channelData.length);
            
            for (let j = start; j < end; j++) {
                const val = Math.abs(channelData[j]);
                if (val > max) max = val;
            }
            calculatedPeaks.push(max);
          }
          setPeaks(calculatedPeaks);
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

  // 2. Draw Waveform from Peaks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Using pre-calculated peaks allows extremely fast rendering
    peaks.forEach((peak, i) => {
      const x = i;
      
      // Calculate bar height based on peak amplitude (0..1)
      // Scale it to fit canvas height comfortably
      const barHeight = Math.max(2, peak * height * 0.9); 
      const y = (height - barHeight) / 2;

      // Color logic
      const progressPercent = isCurrentTrackPlaying ? (currentTime / duration) : 0;
      const isPlayed = (i / width) < progressPercent;

      if (isCurrentTrackPlaying) {
          ctx.fillStyle = isPlayed ? '#fbbf24' : '#451a03'; // Amber-400 vs Amber-950
      } else {
          ctx.fillStyle = '#78350f'; // Amber-900 (Inactive)
      }
      
      ctx.fillRect(x, y, 1, barHeight);
    });
    
    // Draw Scrubber / Playhead
    if (isCurrentTrackPlaying) {
        const playheadX = (currentTime / duration) * width;
        ctx.fillStyle = '#fff';
        ctx.fillRect(playheadX, 0, 2, height);
        
        // Glow effect
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
        ctx.shadowBlur = 0; // Reset
    }

  }, [peaks, currentTime, duration, isCurrentTrackPlaying]);

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
      
      {/* Volume Control - Expanded Hit Area */}
      <div className="ml-4 flex items-center h-full group pl-4 pr-6 relative">
         <div className="w-0 overflow-hidden group-hover:w-32 transition-all duration-300 ease-out flex items-center mr-2">
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50" 
            />
         </div>
         <button 
           onClick={() => onVolumeChange(volume === 0 ? 1 : 0)}
           className="text-slate-500 hover:text-amber-500 transition-colors p-3 hover:bg-slate-900/50 rounded-full"
         >
            <VolumeIcon size={24} />
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
