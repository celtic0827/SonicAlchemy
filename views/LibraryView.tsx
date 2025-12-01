
import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types';
import TrackCard from '../components/TrackCard';
import TrackRow from '../components/TrackRow';
import TagCloud from '../components/TagCloud';
import WaveformPlayer from '../components/WaveformPlayer';
import { LayoutGrid, List, Activity, FilterX, ChevronDown } from 'lucide-react';

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
  
  // Volume (0.0 to 1.0)
  const [volume, setVolume] = useState(1);
  
  // Playback Progress
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);

  // --- Filtering ---
  const [bpmMin, setBpmMin] = useState<number | null>(null);
  const [bpmMax, setBpmMax] = useState<number | null>(null);
  const [activeBpmSelector, setActiveBpmSelector] = useState<'min' | 'max' | null>(null);

  const filteredTracks = tracks.filter(track => {
    // Tag Filter
    if (selectedTags.length > 0) {
        const matchesTags = selectedTags.every(tag => track.tags.includes(tag));
        if (!matchesTags) return false;
    }

    // BPM Filter
    if (track.bpm) {
        const min = bpmMin !== null ? bpmMin : 0;
        const max = bpmMax !== null ? bpmMax : 9999;
        if (track.bpm < min || track.bpm > max) return false;
    } else if (bpmMin !== null || bpmMax !== null) {
        // If track has no BPM but filters are active, usually exclude
        return false;
    }

    return true;
  });

  const clearFilters = () => {
    selectedTags.forEach(t => onToggleTag(t)); // Toggle all off
    setBpmMin(null);
    setBpmMax(null);
  }

  const selectedTrack = tracks.find(t => t.id === selectedTrackId);
  const playingTrack = tracks.find(t => t.id === playingTrackId);

  // --- BPM Selector Helpers ---
  const BPM_OPTIONS = Array.from({ length: 15 }, (_, i) => 60 + i * 10); // 60, 70 ... 200

  const getValidBpmOptions = (type: 'min' | 'max') => {
      if (type === 'min') {
          // If Max is set, Min must be strictly LESS than Max
          if (bpmMax === null) return BPM_OPTIONS;
          return BPM_OPTIONS.filter(v => v < bpmMax);
      } else {
          // If Min is set, Max must be strictly GREATER than Min
          if (bpmMin === null) return BPM_OPTIONS;
          return BPM_OPTIONS.filter(v => v > bpmMin);
      }
  };

  // --- Audio Effects ---

  // Handle Volume Changes
  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle Play/Pause Logic safely
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Using a simple check to prevent race conditions
    if (isPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Ignore the abort error (happens if pause is called quickly after play)
                if (error.name !== 'AbortError') {
                    console.error("Playback error", error);
                    setIsPlaying(false);
                }
            });
        }
    } else {
        audio.pause();
    }
  }, [isPlaying, playingTrackId]); 

  // Handle Track Source Change
  useEffect(() => {
    if (audioRef.current) {
        if (playingTrackId && playingTrack?.audioUrl) {
            // Audio source updates automatically via prop
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

  const getNextTrackId = (currentId: string, direction: 'next' | 'prev') => {
    const currentIndex = filteredTracks.findIndex(t => t.id === currentId);
    if (currentIndex === -1) return filteredTracks[0]?.id; // Fallback

    let nextIndex;
    if (direction === 'next') {
        nextIndex = (currentIndex + 1) % filteredTracks.length;
    } else {
        nextIndex = (currentIndex - 1 + filteredTracks.length) % filteredTracks.length;
    }
    return filteredTracks[nextIndex].id;
  };

  const handleNext = () => {
    const currentId = playingTrackId || selectedTrackId;
    if (!currentId || filteredTracks.length === 0) return;
    
    const nextId = getNextTrackId(currentId, 'next');
    if (nextId) handlePlay(nextId);
  };

  const handlePrevious = () => {
    const currentId = playingTrackId || selectedTrackId;
    if (!currentId || filteredTracks.length === 0) return;
    
    const prevId = getNextTrackId(currentId, 'prev');
    if (prevId) handlePlay(prevId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-32 w-full relative">
      
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={playingTrack?.audioUrl}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleNext} // Auto-play next
      />

      {/* Top Section: Tag Cloud & Filters */}
      <section className="bg-slate-900/50 border-y border-slate-800/50 -mx-4 px-4 lg:-mx-8 lg:px-8 py-6 sticky top-0 z-20 backdrop-blur-md shadow-xl flex flex-col gap-4">
        <TagCloud 
          tracks={tracks} 
          selectedTags={selectedTags} 
          onToggleTag={onToggleTag} 
        />
        
        {/* BPM Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs relative">
           <div className="flex items-center gap-2 text-slate-500 bg-slate-950 p-1.5 rounded border border-slate-800 shrink-0">
             <Activity size={14} className="text-amber-600" />
             <span className="font-bold uppercase tracking-wider text-[10px]">Tempo</span>
           </div>
           
           <div className="flex items-center gap-2">
             {/* Min Selector */}
             <div className="relative">
                <button 
                  onClick={() => setActiveBpmSelector(activeBpmSelector === 'min' ? null : 'min')}
                  className={`w-24 flex items-center justify-between bg-slate-900 border rounded px-3 py-2 text-slate-200 focus:outline-none font-mono text-xs transition-colors ${activeBpmSelector === 'min' ? 'border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-slate-800 hover:border-slate-600'}`}
                >
                    <span className="truncate">Min: {bpmMin ?? 'Any'}</span>
                    <ChevronDown size={12} className={`shrink-0 ml-1 transition-transform ${activeBpmSelector === 'min' ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Min Popover */}
                {activeBpmSelector === 'min' && (
                    <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveBpmSelector(null)}></div>
                    <div className="absolute top-full mt-2 left-0 w-72 bg-slate-950 border border-amber-900/50 rounded-lg shadow-2xl z-40 p-3 grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => { setBpmMin(null); setActiveBpmSelector(null); }}
                            className={`col-span-4 p-2 text-center text-[10px] uppercase font-bold tracking-widest rounded border border-slate-800 hover:bg-slate-900 transition-colors ${bpmMin === null ? 'bg-amber-950/30 text-amber-500 border-amber-500/30' : 'text-slate-500'}`}
                        >
                            Any (No Limit)
                        </button>
                        {getValidBpmOptions('min').length > 0 ? (
                            getValidBpmOptions('min').map(val => (
                                <button
                                    key={val}
                                    onClick={() => { setBpmMin(val); setActiveBpmSelector(null); }}
                                    className={`p-3 text-center font-mono text-xs rounded border border-slate-800 hover:bg-slate-900 transition-colors ${bpmMin === val ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'text-slate-400 hover:text-amber-500 hover:border-amber-500/30'}`}
                                >
                                    {val}
                                </button>
                            ))
                        ) : (
                            <div className="col-span-4 text-center text-slate-600 py-2 text-xs italic">
                                No lower options available
                            </div>
                        )}
                    </div>
                    </>
                )}
             </div>

             <span className="text-slate-600">-</span>

             {/* Max Selector */}
             <div className="relative">
                <button 
                  onClick={() => setActiveBpmSelector(activeBpmSelector === 'max' ? null : 'max')}
                  className={`w-24 flex items-center justify-between bg-slate-900 border rounded px-3 py-2 text-slate-200 focus:outline-none font-mono text-xs transition-colors ${activeBpmSelector === 'max' ? 'border-amber-500 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'border-slate-800 hover:border-slate-600'}`}
                >
                    <span className="truncate">Max: {bpmMax ?? 'Any'}</span>
                    <ChevronDown size={12} className={`shrink-0 ml-1 transition-transform ${activeBpmSelector === 'max' ? 'rotate-180' : ''}`} />
                </button>

                {/* Max Popover */}
                {activeBpmSelector === 'max' && (
                    <>
                    <div className="fixed inset-0 z-30" onClick={() => setActiveBpmSelector(null)}></div>
                    <div className="absolute top-full mt-2 left-0 w-72 bg-slate-950 border border-amber-900/50 rounded-lg shadow-2xl z-40 p-3 grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95 duration-200">
                        <button 
                            onClick={() => { setBpmMax(null); setActiveBpmSelector(null); }}
                            className={`col-span-4 p-2 text-center text-[10px] uppercase font-bold tracking-widest rounded border border-slate-800 hover:bg-slate-900 transition-colors ${bpmMax === null ? 'bg-amber-950/30 text-amber-500 border-amber-500/30' : 'text-slate-500'}`}
                        >
                            Any (No Limit)
                        </button>
                        {getValidBpmOptions('max').length > 0 ? (
                            getValidBpmOptions('max').map(val => (
                                <button
                                    key={val}
                                    onClick={() => { setBpmMax(val); setActiveBpmSelector(null); }}
                                    className={`p-3 text-center font-mono text-xs rounded border border-slate-800 hover:bg-slate-900 transition-colors ${bpmMax === val ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'text-slate-400 hover:text-amber-500 hover:border-amber-500/30'}`}
                                >
                                    {val}
                                </button>
                            ))
                         ) : (
                            <div className="col-span-4 text-center text-slate-600 py-2 text-xs italic">
                                No higher options available
                            </div>
                        )}
                    </div>
                    </>
                )}
             </div>
           </div>
           
           {(bpmMin !== null || bpmMax !== null || selectedTags.length > 0) && (
               <button onClick={clearFilters} className="ml-auto text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors" title="Clear All Filters">
                  <FilterX size={14} /> <span className="hidden sm:inline">Clear</span>
               </button>
           )}
        </div>
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
              onClick={clearFilters}
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
            volume={volume}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onVolumeChange={setVolume}
        />
      )}
    </div>
  );
};

export default LibraryView;
