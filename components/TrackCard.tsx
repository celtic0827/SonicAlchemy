import React, { useRef, useState, useEffect } from 'react';
import { Track } from '../types';
import { Play, Pause, Plus, Check } from 'lucide-react';

interface TrackCardProps {
  track: Track;
  onClick: (id: string) => void;
  isInMixingQueue: boolean;
  onToggleQueue: (id: string, e: React.MouseEvent) => void;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, onClick, isInMixingQueue, onToggleQueue }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!track.audioUrl) {
      onClick(track.id);
      return;
    }
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div 
      onClick={() => onClick(track.id)}
      className="group relative bg-slate-900 rounded-lg overflow-hidden transition-all duration-300 border border-slate-800 hover:border-amber-500/40 cursor-pointer hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:-translate-y-0.5"
    >
      {track.audioUrl && (
        <audio 
          ref={audioRef} 
          src={track.audioUrl} 
          onEnded={handleAudioEnded}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Image Overlay */}
      <div className="relative aspect-square overflow-hidden bg-slate-950">
        <img 
          src={track.coverUrl} 
          alt={track.title} 
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100 ${isPlaying ? 'scale-105 opacity-100' : ''}`}
        />
        
        {/* Play Button - Only show on hover or playing */}
        <div 
          onClick={handlePlayToggle}
          className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-all duration-300 ${isPlaying ? 'opacity-100 bg-black/40' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <div className="w-10 h-10 rounded-full bg-slate-900/80 backdrop-blur-sm border border-amber-500/30 flex items-center justify-center hover:scale-110 transition-transform">
            {isPlaying ? (
               <Pause size={18} className="text-amber-400 fill-amber-400" />
            ) : (
               <Play size={18} className="text-slate-200 fill-slate-200 ml-0.5" />
            )}
          </div>
        </div>
        
        {/* Mixing Queue Button */}
        <button
          onClick={(e) => onToggleQueue(track.id, e)}
          className={`absolute top-2 right-2 p-1.5 rounded bg-slate-900/90 backdrop-blur-sm border transition-all z-10 ${
            isInMixingQueue 
              ? 'border-amber-500 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
              : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 opacity-0 group-hover:opacity-100'
          }`}
          title={isInMixingQueue ? "Remove from Mixing" : "Add to Mixing"}
        >
          {isInMixingQueue ? <Check size={12} strokeWidth={3} /> : <Plus size={12} />}
        </button>
      </div>

      <div className="p-3">
        <h3 className={`font-medium truncate text-sm transition-colors ${isPlaying ? 'text-amber-400' : 'text-slate-200 group-hover:text-white'}`}>
          {track.title}
        </h3>
        
        <div className="flex flex-wrap gap-1 mt-2 h-5 overflow-hidden">
          {track.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] uppercase tracking-wider text-slate-500 border border-slate-800 px-1.5 rounded bg-slate-950">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrackCard;