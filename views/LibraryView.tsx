
import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types';
import TrackCard from '../components/TrackCard';
import TrackRow from '../components/TrackRow';
import TagCloud from '../components/TagCloud';
import WaveformPlayer from '../components/WaveformPlayer';
import { LayoutGrid, List } from 'lucide-react';

interface LibraryViewProps {
  tracks: Track[];
  selectedTags: string[];
  mixingQueue: string[];
  onToggleTag: (tag: string) => void;
  onSelectTrack: (id: string) => void; // Used for navigating to detail view usually
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
  // View Mode Persistance
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('libraryViewMode');
    return (saved === 'grid' || saved === 'list') ? saved : 'grid';
  });

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('libraryViewMode', mode);
  };

  // --- Playback & Selection State ---
  
  // Track that is clicked/highlighted in the list (shown in bottom player)
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  
  // Track that is actually outputting sound
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  
  // Is audio running?
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Playback Progress
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Filtering ---
  const filteredTracks = tracks.filter(track => {
    if (selectedTags.length === 0) return true;
    return selectedTags.every(tag => track.tags.includes(tag));
  });

  const selectedTrack = tracks.find(t => t.id === selectedTrackId);
  const playingTrack = tracks.find(t => t.id === playingTrackId);

  // --- Audio Effects ---

  // Handle Play/Pause Logic
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
        audioRef.current.play().catch(e => {
            console.error("Playback error", e);
            setIsPlaying(false);
        });
    } else {
        audioRef.current.pause();
    }
  }, [isPlaying, playingTrackId]); // Depend on ID change to trigger re-play if source updates

  // Handle Track Source Change
  useEffect(() => {
    if (audioRef.current) {
        if (playingTrackId && playingTrack?.audioUrl) {
            // Only update src if it's different to prevent reload
            // But we rely on React to update the src prop in render
        } else {
            // No track playing
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }
  }, [playingTrackId, playingTrack]);

  // --- Event Handlers ---

  const handleTrackClick = (id: string) => {
    // Just select it for preview (waveform update)
    setSelectedTrackId(id);
  };

  const handleNavigateToDetail = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onSelectTrack(id);
  }

  const handleInspect = (id: string) => {
    onSelectTrack(id);
  }

  const handlePlay = (id: string) => {
    if (playingTrackId === id) {
        setIsPlaying(true);
    } else {
        // Change track
        setPlayingTrackId(id);
        setSelectedTrackId(id); // Sync selection
        setIsPlaying(true);
        setCurrentTime(0);
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32 w-full relative">
      
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={playingTrack?.audioUrl}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Top Section: Tag Cloud */}
      <section className="bg-slate-900/50 border-y border-slate-800/50 -mx-4 px-4 lg:-mx-8 lg:px-8 py-6 sticky top-0 z-20 backdrop-blur-md shadow-xl">
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
      <section className="w-full min-h-[50vh]">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7 3xl:grid-cols-8 gap-4">
              {filteredTracks.map(track => (
                <div key={track.id} className="relative group/card">
                    <TrackCard 
                        track={track} 
                        onClick={handleTrackClick}
                        isInMixingQueue={mixingQueue.includes(track.id)}
                        onToggleQueue={onToggleQueue}
                        onDelete={onDeleteTrack}
                        selectedTrackId={selectedTrackId}
                        playingTrackId={playingTrackId}
                        isPlaying={isPlaying}
                        onPlay={handlePlay}
                        onPause={handlePause}
                    />
                    {/* Hover Inspect Button */}
                    <button 
                        onClick={(e) => handleNavigateToDetail(e, track.id)}
                        className="absolute top-2 right-10 p-1.5 rounded bg-slate-900/90 backdrop-blur-sm border border-slate-700 text-slate-400 hover:text-white hover:border-amber-500 opacity-0 group-hover/card:opacity-100 transition-opacity z-10"
                        title="View Details"
                    >
                        <List size={12} />
                    </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1 w-full">
              {filteredTracks.map(track => (
                <TrackRow
                    key={track.id}
                    track={track}
                    onClick={handleTrackClick}
                    onInspect={handleInspect}
                    isInMixingQueue={mixingQueue.includes(track.id)}
                    onToggleQueue={onToggleQueue}
                    onDelete={onDeleteTrack}
                    selectedTrackId={selectedTrackId}
                    playingTrackId={playingTrackId}
                    isPlaying={isPlaying}
                    onPlay={handlePlay}
                    onPause={handlePause}
                />
              ))}
            </div>
          )
        )}
      </section>

      {/* Bottom Waveform Player */}
      {selectedTrack && (
        <WaveformPlayer 
            selectedTrack={selectedTrack}
            playingTrackId={playingTrackId}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
        />
      )}
    </div>
  );
};

export default LibraryView;
