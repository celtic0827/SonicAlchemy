
import React, { useState, useEffect } from 'react';
import { Track } from '../types';
import TrackCard from '../components/TrackCard';
import TrackRow from '../components/TrackRow';
import TagCloud from '../components/TagCloud';
import { LayoutGrid, List } from 'lucide-react';

interface LibraryViewProps {
  tracks: Track[];
  selectedTags: string[];
  mixingQueue: string[];
  onToggleTag: (tag: string) => void;
  onSelectTrack: (id: string) => void;
  onToggleQueue: (id: string, e: React.MouseEvent) => void;
  onDeleteTrack: (id: string) => void;
}

const LibraryView: React.FC<LibraryViewProps> = ({ 
  tracks, 
  selectedTags, 
  mixingQueue,
  onToggleTag, 
  onSelectTrack, 
  onToggleQueue,
  onDeleteTrack
}) => {
  // Initialize from localStorage or default to 'grid'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('libraryViewMode');
    return (saved === 'grid' || saved === 'list') ? saved : 'grid';
  });

  // Persist change
  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('libraryViewMode', mode);
  };

  const filteredTracks = tracks.filter(track => {
    if (selectedTags.length === 0) return true;
    return selectedTags.every(tag => track.tags.includes(tag));
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Top Section: Tag Cloud */}
      <section className="bg-slate-900/50 border-y border-slate-800/50 -mx-4 px-4 py-6 sticky top-0 z-20 backdrop-blur-md shadow-xl">
        <TagCloud 
          tracks={tracks} 
          selectedTags={selectedTags} 
          onToggleTag={onToggleTag} 
        />
      </section>

      {/* Header & Controls */}
      <section className="flex justify-between items-end border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-light text-white tracking-tight">Library</h2>
          <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-wider">
            {filteredTracks.length} / {tracks.length} Records
          </p>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button 
            onClick={() => handleSetViewMode('grid')}
            className={`p-2 rounded transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-amber-500 shadow-sm' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => handleSetViewMode('list')}
            className={`p-2 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800 text-amber-500 shadow-sm' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <List size={18} />
          </button>
        </div>
      </section>

      {/* Content */}
      <section>
        {filteredTracks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
            <p className="text-slate-500 font-light">The void returns nothing.</p>
            <button 
              onClick={() => selectedTags.forEach(t => onToggleTag(t))}
              className="mt-4 text-amber-600 hover:text-amber-500 text-sm border-b border-amber-600/30 hover:border-amber-500 pb-0.5 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          viewMode === 'grid' ? (
            /* Updated Grid cols for better responsiveness on ultra-wide screens */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 3xl:grid-cols-8 gap-4">
              {filteredTracks.map(track => (
                <TrackCard 
                  key={track.id} 
                  track={track} 
                  onClick={onSelectTrack}
                  isInMixingQueue={mixingQueue.includes(track.id)}
                  onToggleQueue={onToggleQueue}
                  onDelete={onDeleteTrack}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTracks.map(track => (
                <TrackRow
                  key={track.id}
                  track={track}
                  onClick={onSelectTrack}
                  isInMixingQueue={mixingQueue.includes(track.id)}
                  onToggleQueue={onToggleQueue}
                  onDelete={onDeleteTrack}
                />
              ))}
            </div>
          )
        )}
      </section>
    </div>
  );
};

export default LibraryView;
