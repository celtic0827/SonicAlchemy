import React, { useRef, useState, useEffect } from 'react';
import { Track } from '../types';
import { Play, Pause, Plus, Check, MoreVertical } from 'lucide-react';

interface TrackRowProps {
  track: Track;
  onClick: (id: string) => void;
  isInMixingQueue: boolean;
  onToggleQueue: (id: string, e: React.MouseEvent) => void;
}

const TrackRow: React.FC<TrackRowProps> = ({ track, onClick, isInMixingQueue, onToggleQueue }) => {
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

  return (
    <div 
      onClick={() => onClick(track.id)}
      className={`group flex items-center p-2 rounded-lg border border-transparent hover:border-amber-500/30 hover:bg-slate-900 transition-all cursor-pointer mb-1 ${isPlaying ? 'bg-slate-900 border-amber-500/20' : ''}`}
    >
      {track.audioUrl && (
        <audio 
          ref={audioRef} 
          src={track.audioUrl} 
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* Cover / Play Button */}
      <div className="relative w-10 h-10 shrink-0 mr-4 rounded overflow-hidden bg-slate-800">
        <img src={track.coverUrl} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
        <div 
          onClick={handlePlayToggle}
          className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          {isPlaying ? (
            <Pause size={16} className="text-amber-400 fill-amber-400" />
          ) : (
            <Play size={16} className="text-slate-200 fill-slate-200" />
          )}
        </div>
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0 mr-4">
        <h4 className={`text-sm font-medium truncate ${isPlaying ? 'text-amber-400' : 'text-slate-200 group-hover:text-white'}`}>
          {track.title}
        </h4>
      </div>

      {/* Prompt Preview (Desktop only) */}
      <div className="hidden md:block flex-[2] mr-4">
        <p className="text-xs text-slate-500 truncate group-hover:text-slate-400 transition-colors">
          {track.prompt}
        </p>
      </div>

      {/* Tags (Desktop only) */}
      <div className="hidden lg:flex gap-1 mr-4 w-48 overflow-hidden">
        {track.tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 whitespace-nowrap">
            {tag}
          </span>
        ))}
        {track.tags.length > 2 && (
            <span className="text-[10px] text-slate-600 self-center">+{track.tags.length - 2}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => onToggleQueue(track.id, e)}
          className={`p-1.5 rounded-md border transition-all ${
            isInMixingQueue 
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
              : 'border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600'
          }`}
          title="Mix"
        >
          {isInMixingQueue ? <Check size={14} /> : <Plus size={14} />}
        </button>
      </div>
    </div>
  );
};

export default TrackRow;