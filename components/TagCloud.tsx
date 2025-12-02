
import React, { useMemo } from 'react';
import { TagStat, Track } from '../types';

interface TagCloudProps {
  tracks: Track[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
}

const TagCloud: React.FC<TagCloudProps> = ({ tracks, selectedTags, onToggleTag }) => {
  
  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {};
    tracks.forEach(track => {
      track.tags.forEach(tag => {
        const t = tag.trim();
        if (t) {
          stats[t] = (stats[t] || 0) + 1;
        }
      });
    });

    return Object.entries(stats)
      .map(([tag, count]) => ({ tag, count } as TagStat))
      .sort((a, b) => b.count - a.count);
  }, [tracks]);

  if (tagStats.length === 0) {
    return <div className="text-slate-600 text-xs italic p-4">No tags available.</div>;
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="w-full text-[10px] font-bold text-amber-600/70 uppercase tracking-widest mb-2 border-b border-white/5 pb-1">
          Frequency Filters
        </div>
        {tagStats.map((stat) => {
          const isSelected = selectedTags.includes(stat.tag);
          return (
            <button
              key={stat.tag}
              onClick={() => onToggleTag(stat.tag)}
              className={`
                flex items-center space-x-2 px-3 py-1.5 rounded text-xs transition-all duration-300 border backdrop-blur-sm
                ${isSelected 
                  ? 'bg-amber-500/90 text-slate-950 border-amber-500 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105' 
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-700/50 hover:border-amber-500/30 hover:text-amber-400'}
              `}
            >
              <span>{stat.tag}</span>
              <span className={`text-[9px] ml-1 ${isSelected ? 'opacity-80' : 'opacity-40'}`}>
                {stat.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TagCloud;
