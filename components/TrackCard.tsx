import React from 'react';
import { Track } from '../types';
import { Play, Pause, Plus, Check, Trash2, Activity } from 'lucide-react';

interface TrackCardProps {
  track: Track;
  onClick: (id: string) => void;
  isInMixingQueue: boolean;
  onToggleQueue: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  selectedTrackId: string | null;
  playingTrackId: string | null;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onPause: () => void;
}

const TrackCard: React.FC<TrackCardProps> = ({ 
  track, 
  onClick, 
  isInMixingQueue, 
  onToggleQueue, 
  onDelete,
  selectedTrackId,
  playingTrackId,
  isPlaying,
  onPlay,
  onPause
}) => {
  
  const isSelected = selectedTrackId === track.id;
  const isCurrent = playingTrackId === track.id;
  const isAudioActive = isCurrent && isPlaying;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!track.audioUrl) {
      onClick(track.id);
      return;
    }
    if (isAudioActive) {
      onPause();
    } else {
      onPlay(track.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(track.id);
  };

  return (
    <div 
      onClick={() => onClick(track.id)}
      className={`
        group relative rounded-lg overflow-hidden transition-all duration-300 border cursor-pointer hover:-translate-y-0.5
        ${isSelected 
          ? 'bg-slate-900 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
          : 'bg-slate-900 border-slate-800 hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)]'
        }
      `}
    >
      {/* Image Overlay */}
      <div className="relative aspect-square overflow-hidden bg-slate-950">
        <img 
          src={track.coverUrl} 
          alt={track.title} 
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100 ${isAudioActive ? 'scale-105 opacity-100' : ''}`}
        />
        
        {/* BPM Badge - Top Left (DJ style) */}
        {track.bpm && (
            <div className="absolute top-0 left-0 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-br-lg border-b border-r border-white/10 flex items-center gap-1 z-10">
                <Activity size={10} className="text-amber-500" />
                <span className="text-[10px] font-mono font-bold text-white tracking-wider">{track.bpm}</span>
            </div>
        )}

        {/* Play Button */}
        <div 
          onClick={handlePlayToggle}
          className={`absolute inset-0 bg-black/20 flex items-center justify-center transition-all duration-300 ${isAudioActive ? 'opacity-100 bg-black/40' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <div className="w-10 h-10 rounded-full bg-slate-900/80 backdrop-blur-sm border border-amber-500/30 flex items-center justify-center hover:scale-110 transition-transform">
            {isAudioActive ? (
               <Pause size={18} className="text-amber-400 fill-amber-400" />
            ) : (
               <Play size={18} className="text-slate-200 fill-slate-200 ml-0.5" />
            )}
          </div>
        </div>
        
        {/* Queue Button */}
        <button
          onClick={(e) => onToggleQueue(track.id, e)}
          className={`absolute top-2 right-2 p-1.5 rounded bg-slate-900/90 backdrop-blur-sm border transition-all z-10 ${
            isInMixingQueue 
              ? 'border-amber-500 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' 
              : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 opacity-0 group-hover:opacity-100'
          }`}
        >
          {isInMixingQueue ? <Check size={12} strokeWidth={3} /> : <Plus size={12} />}
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="absolute bottom-2 left-2 p-1.5 rounded bg-slate-900/90 backdrop-blur-sm border border-transparent hover:border-red-900/50 text-slate-500 hover:text-red-500 transition-all z-10 opacity-0 group-hover:opacity-100 hover:bg-red-950/20"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div className="p-3">
        <h3 className={`font-medium truncate text-sm transition-colors ${isCurrent ? 'text-amber-400' : 'text-slate-200 group-hover:text-white'}`}>
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