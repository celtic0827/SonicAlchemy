
import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../types';
import TrackCard from '../components/TrackCard';
import TrackRow from '../components/TrackRow';
import TagCloud from '../components/TagCloud';
import WaveformPlayer from '../components/WaveformPlayer';
import { LayoutGrid, List, Activity, Filter, ChevronDown, Search, X, SlidersHorizontal } from 'lucide-react';

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

  // UI State
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

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
  const [searchQuery, setSearchQuery] = useState('');
  const [bpmMin, setBpmMin] = useState<number | null>(null);
  const [bpmMax, setBpmMax] = useState<number | null>(null);
  const [activeBpmSelector, setActiveBpmSelector] = useState<'min' | 'max' | null>(null);

  // Check if any filter is active (to highlight the button)
  const isFilterActive = selectedTags.length > 0 || bpmMin !== null || bpmMax !== null;

  const filteredTracks = tracks.filter(track => {
    // Text Search
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = track.title.toLowerCase().includes(query);
        const matchesPrompt = track.prompt.toLowerCase().includes(query);
        const matchesTags = track.tags.some(t => t.toLowerCase().includes(query));
        
        if (!matchesTitle && !matchesPrompt && !matchesTags) return false;
    }

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

  // FORCE GLASS STYLE
  // Using very low opacity (0.15) to allow content to show through,
  // High blur (24px) for the frost effect,
  // High saturation (180%) to make colors pop behind the glass,
  // Translate3d to force GPU layer.
  const glassStyle: React.CSSProperties = {
    backgroundColor: 'rgba(2, 6, 23, 0.15)', // Very transparent slate-950
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
    transform: 'translate3d(0,0,0)', // GPU Force
    willChange: 'backdrop-filter',
    isolation: 'isolate',
  };

  // Style for inner dropdowns (needs to be darker to be readable)
  const dropdownGlassStyle: React.CSSProperties = {
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  };

  return (
    <div className="w-full relative min-h-screen">
      
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={playingTrack?.audioUrl}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleNext} // Auto-play next
      />

      {/* 
        --- Fixed Floating Control Bar --- 
        Uses position: fixed to stay on screen regardless of scroll.
        Uses pointer-events-none on the wrapper so the invisible padding areas don't block clicks below.
      */}
      <div className="fixed top-0 left-16 lg:left-64 right-0 z-50 p-4 lg:p-8 pointer-events-none">
         {/* 
            Glass Panel Container 
         */}
         <div 
            className="max-w-full rounded-xl flex flex-col relative pointer-events-auto transition-all duration-300"
            style={glassStyle}
         >
            
            {/* Top Row: Search & Toggles */}
            <div className="flex items-center gap-3 p-3 relative z-50">
               
               {/* Search Input */}
               <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search library..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900/30 border border-slate-700/30 rounded-lg py-2.5 pl-10 pr-8 text-sm text-slate-200 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 outline-none transition-all placeholder-slate-500 hover:bg-slate-900/50"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                            <X size={14} />
                        </button>
                    )}
               </div>

               {/* Separator */}
               <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block"></div>

               {/* Filter Toggle Button */}
               <button 
                 onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                 className={`relative p-2.5 rounded-lg border transition-all flex items-center gap-2 text-sm font-medium ${
                    isFiltersOpen || isFilterActive
                     ? 'bg-amber-950/40 border-amber-500/50 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                     : 'bg-slate-900/20 border-slate-700/30 text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-900/40'
                 }`}
               >
                 <SlidersHorizontal size={18} />
                 <span className="hidden md:inline">Filters</span>
                 {isFilterActive && (
                     <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-slate-950"></span>
                 )}
               </button>

               {/* View Toggle Group */}
               <div className="flex bg-slate-900/30 p-1 rounded-lg border border-slate-700/30 shrink-0">
                  <button 
                    onClick={() => handleSetViewMode('grid')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-slate-800/60 text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                  <button 
                    onClick={() => handleSetViewMode('list')}
                    className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-slate-800/60 text-amber-500 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <List size={16} />
                  </button>
               </div>
            </div>

            {/* 
              --- Absolute Overlay Panel (Expandable) ---
              Uses the same glassStyle to maintain continuity.
              Margin top ensures it sits nicely below.
            */}
            {isFiltersOpen && (
                <div 
                    className="absolute top-[calc(100%+8px)] left-0 right-0 rounded-xl p-5 z-50 animate-in slide-in-from-top-2 duration-200"
                    style={glassStyle}
                >
                    <div className="flex flex-col gap-4">
                        
                        {/* 1. Tag Cloud */}
                        <TagCloud 
                            tracks={tracks} 
                            selectedTags={selectedTags} 
                            onToggleTag={onToggleTag} 
                        />
                        
                        {/* 2. BPM & Actions Row */}
                        <div className="flex flex-wrap items-center gap-4 mt-2 border-t border-white/5 pt-4">
                            
                            {/* BPM Selector */}
                            <div className="flex items-center bg-slate-900/30 border border-slate-800/50 rounded-md shadow-sm relative">
                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/40 border-r border-slate-800/50 text-slate-500 rounded-l-md">
                                    <Activity size={14} className="text-amber-600" />
                                    <span className="font-bold uppercase tracking-wider text-[10px]">Tempo</span>
                                </div>

                                {/* Min Selector */}
                                <div className="border-r border-slate-800/50 relative">
                                    <button 
                                    onClick={() => setActiveBpmSelector(activeBpmSelector === 'min' ? null : 'min')}
                                    className={`flex items-center justify-between px-3 py-2 min-w-[90px] text-slate-200 focus:outline-none font-mono text-xs transition-colors hover:bg-slate-800/30 ${activeBpmSelector === 'min' ? 'text-amber-500 bg-amber-950/20' : ''}`}
                                    >
                                        <span className={bpmMin ? 'text-amber-500 font-bold' : 'text-slate-500'}>
                                            {bpmMin ? `${bpmMin}` : 'Min'}
                                        </span>
                                        <ChevronDown size={10} className={`shrink-0 ml-2 transition-transform opacity-50 ${activeBpmSelector === 'min' ? 'rotate-180 text-amber-500 opacity-100' : ''}`} />
                                    </button>
                                    
                                    {activeBpmSelector === 'min' && (
                                        <>
                                        <div className="fixed inset-0 z-30" onClick={() => setActiveBpmSelector(null)}></div>
                                        <div 
                                            className="absolute top-full mt-2 left-0 w-72 rounded-lg shadow-2xl z-40 p-3 grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95 duration-200"
                                            style={dropdownGlassStyle}
                                        >
                                            <button 
                                                onClick={() => { setBpmMin(null); setActiveBpmSelector(null); }}
                                                className={`col-span-4 p-2 text-center text-[10px] uppercase font-bold tracking-widest rounded border border-slate-800 hover:bg-slate-900/50 transition-colors ${bpmMin === null ? 'bg-amber-950/30 text-amber-500 border-amber-500/30' : 'text-slate-500'}`}
                                            >
                                                Any (No Limit)
                                            </button>
                                            {getValidBpmOptions('min').length > 0 ? (
                                                getValidBpmOptions('min').map(val => (
                                                    <button
                                                        key={val}
                                                        onClick={() => { setBpmMin(val); setActiveBpmSelector(null); }}
                                                        className={`p-3 text-center font-mono text-xs rounded border border-slate-800 hover:bg-slate-900/50 transition-colors ${bpmMin === val ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'text-slate-400 hover:text-amber-500 hover:border-amber-500/30'}`}
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

                                {/* Max Selector */}
                                <div className="relative">
                                    <button 
                                    onClick={() => setActiveBpmSelector(activeBpmSelector === 'max' ? null : 'max')}
                                    className={`flex items-center justify-between px-3 py-2 min-w-[90px] text-slate-200 focus:outline-none font-mono text-xs transition-colors hover:bg-slate-800/30 rounded-r-md ${activeBpmSelector === 'max' ? 'text-amber-500 bg-amber-950/20' : ''}`}
                                    >
                                        <span className={bpmMax ? 'text-amber-500 font-bold' : 'text-slate-500'}>
                                            {bpmMax ? `${bpmMax}` : 'Max'}
                                        </span>
                                        <ChevronDown size={10} className={`shrink-0 ml-2 transition-transform opacity-50 ${activeBpmSelector === 'max' ? 'rotate-180 text-amber-500 opacity-100' : ''}`} />
                                    </button>

                                    {activeBpmSelector === 'max' && (
                                        <>
                                        <div className="fixed inset-0 z-30" onClick={() => setActiveBpmSelector(null)}></div>
                                        <div 
                                            className="absolute top-full mt-2 left-0 w-72 rounded-lg shadow-2xl z-40 p-3 grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95 duration-200"
                                            style={dropdownGlassStyle}
                                        >
                                            <button 
                                                onClick={() => { setBpmMax(null); setActiveBpmSelector(null); }}
                                                className={`col-span-4 p-2 text-center text-[10px] uppercase font-bold tracking-widest rounded border border-slate-800 hover:bg-slate-900/50 transition-colors ${bpmMax === null ? 'bg-amber-950/30 text-amber-500 border-amber-500/30' : 'text-slate-500'}`}
                                            >
                                                Any (No Limit)
                                            </button>
                                            {getValidBpmOptions('max').length > 0 ? (
                                                getValidBpmOptions('max').map(val => (
                                                    <button
                                                        key={val}
                                                        onClick={() => { setBpmMax(val); setActiveBpmSelector(null); }}
                                                        className={`p-3 text-center font-mono text-xs rounded border border-slate-800 hover:bg-slate-900/50 transition-colors ${bpmMax === val ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'text-slate-400 hover:text-amber-500 hover:border-amber-500/30'}`}
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

                            {/* Clear Button */}
                            {isFilterActive && (
                                <button 
                                    onClick={clearFilters}
                                    className="ml-auto text-xs text-slate-500 hover:text-red-400 flex items-center gap-1.5 border border-transparent hover:border-red-900/30 px-2 py-1 rounded transition-colors"
                                >
                                    <Filter size={12} className="line-through" /> 
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
         </div>
      </div>

      {/* 
        --- Click-Out Mask --- 
        Invisible layer to detect clicks outside the panel to close it.
        No blur/color to keep main content visible.
      */}
      {isFiltersOpen && (
          <div 
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsFiltersOpen(false)}
          />
      )}

      {/* Spacer to push content below the fixed header */}
      <div className="h-24 hidden lg:block"></div>
      <div className="h-20 block lg:hidden"></div>

      {/* Info Header & Content */}
      <div className="space-y-6 pb-32 animate-in fade-in duration-500">
        <section className="flex justify-between items-end pb-2 px-1 relative z-20">
            <div>
            <h2 className="text-2xl font-light text-white tracking-tight">Library</h2>
            <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-wider">
                {filteredTracks.length} / {tracks.length} Records
            </p>
            </div>
        </section>

        {/* Content */}
        <section className="w-full min-h-[50vh] relative z-20">
            {filteredTracks.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
                <p className="text-slate-500 font-light">The void returns nothing.</p>
                {(isFilterActive || searchQuery) && (
                    <button 
                    onClick={() => { clearFilters(); setSearchQuery(''); }}
                    className="mt-4 text-amber-600 hover:text-amber-500 text-sm border-b border-amber-600/30 hover:border-amber-500 pb-0.5 transition-colors"
                >
                    Clear all filters & search
                </button>
                )}
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
      </div>

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
