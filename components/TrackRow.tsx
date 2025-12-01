
import React from 'react';
import { Track } from '../types';
import { Play, Plus, Check, Trash2, List } from 'lucide-react';

interface TrackRowProps {
  track: Track;
  onClick: (id: string) => void;
  onInspect: (id: string) => void;
  isInMixingQueue: boolean;
  onToggleQueue: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  selectedTrackId: string | null;
  playingTrackId: string | null;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onPause: () => void;
}

const TrackRow: React.FC<TrackRowProps> = ({ 
  track, 
  onClick, 
  onInspect,
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

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAudioActive) {
      onPause();
    } else {
      onPlay(track.id);
    }
  };

  const handleInspect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInspect(track.id);
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(track.id);
  }

  return (
    <div 
      onClick={() => onClick(track.id)}
      className={`
        group flex items-center p-2 rounded-lg border transition-all cursor-pointer mb-1 relative overflow-hidden
        ${isSelected 
          ? 'bg-slate-900 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.05)]' 
          : 'border-transparent hover:border-amber-500/20 hover:bg-slate-900/50'
        }
      `}
    >
      {/* Active Indicator Bar */}
      {isCurrent && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 animate-pulse"></div>
      )}

      {/* Cover / Play Button */}
      <div className="relative w-10 h-10 shrink-0 mr-4 rounded overflow-hidden bg-slate-800 ml-2">
        <img src={track.coverUrl} alt="" className={`w-full h-full object-cover transition-opacity ${isAudioActive ? 'opacity-40' : 'opacity-80 group-hover:opacity-100'}`} />
        
        {/* Play Overlay */}
        <div 
          onClick={handlePlayClick}
          className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-all ${isAudioActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          {isAudioActive ? (
            <div className="flex gap-0.5 items-end h-4 pb-1">
                <span className="w-1 bg-amber-400 animate-[bounce_1s_infinite] h-2"></span>
                <span className="w-1 bg-amber-400 animate-[bounce_1.2s_infinite] h-4"></span>
                <span className="w-1 bg-amber-400 animate-[bounce_0.8s_infinite] h-3"></span>
            </div>
          ) : (
            <Play size={16} className="text-slate-200 fill-slate-200" />
          )}
        </div>
      </div>

      {/* Title */}
      <div className="w-1/4 min-w-[150px] mr-4 shrink-0">
        <h4 
            className={`text-sm font-medium truncate transition-colors ${isCurrent ? 'text-amber-500' : 'text-slate-200 group-hover:text-white'}`}
            title={track.title}
        >
          {track.title}
        </h4>
      </div>

      {/* Tags */}
      <div className="hidden md:flex flex-1 min-w-0 gap-1 mr-4 overflow-hidden justify-start mask-linear-to-r">
        {track.tags.map(tag => (
          <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap shrink-0 ${
              isSelected ? 'bg-amber-950/30 border-amber-500/20 text-amber-500/80' : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}>
            {tag}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 ml-auto">
        
        <button
          onClick={handleInspect}
          className="p-1.5 rounded-md border border-slate-800 text-slate-500 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100"
          title="Details"
        >
          <List size={14} />
        </button>

        <button
          onClick={(e) => onToggleQueue(track.id, e)}
          className={`p-1.5 rounded-md border transition-all ${
            isInMixingQueue 
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 opacity-100' 
              : 'border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-600 opacity-0 group-hover:opacity-100'
          }`}
          title="Mix"
        >
          {isInMixingQueue ? <Check size={14} /> : <Plus size={14} />}
        </button>

        <button
          onClick={handleDelete}
          className="p-1.5 rounded-md border border-slate-800 text-slate-600 hover:text-red-500 hover:border-red-900/50 hover:bg-red-950/20 transition-all opacity-0 group-hover:opacity-100"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default TrackRow;
