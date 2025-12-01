import React, { useState, useEffect } from 'react';
import { ViewState, Track } from './types';
import { INITIAL_TRACKS } from './constants';
import { LayoutGrid, Disc, Plus, Settings, FlaskConical } from 'lucide-react';
import { getAllTracks, addTrackToDB, updateTrackInDB, deleteTrackFromDB } from './services/db';
import { generateTrackCover } from './services/imageUtils';

import LibraryView from './views/LibraryView';
import TrackDetailView from './views/TrackDetailView';
import MixingRoomView from './views/MixingRoomView';
import AddTrackModal from './components/AddTrackModal';
import SettingsModal from './components/SettingsModal';

const App = () => {
  const [view, setView] = useState<ViewState>('library');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mixingQueue, setMixingQueue] = useState<string[]>([]);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load from DB on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const dbTracks = await getAllTracks();
        if (dbTracks.length > 0) {
          setTracks(dbTracks);
        } else {
          // If completely empty, maybe load initial? 
          // For now, respect empty DB if user cleared it, unless it's first ever run.
          // But to be safe and show content:
          if (localStorage.getItem('hasInitialized') !== 'true') {
             for (const t of INITIAL_TRACKS) {
                await addTrackToDB(t);
             }
             setTracks(INITIAL_TRACKS);
             localStorage.setItem('hasInitialized', 'true');
          }
        }
      } catch (e) {
        console.error("Failed to load DB", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Actions ---

  const handleImportTracks = async (newTracksData: { title: string; prompt: string; tags: string[]; audioUrl?: string }[]) => {
    
    const newTracks: Track[] = newTracksData.map(data => ({
      id: Math.random().toString(36).substr(2, 9) + Date.now().toString(),
      title: data.title,
      prompt: data.prompt,
      tags: data.tags,
      coverUrl: generateTrackCover(data.title),
      createdAt: Date.now(),
      audioUrl: data.audioUrl,
    }));
    
    setTracks(prev => [...newTracks, ...prev]);
    
    try {
        for (const track of newTracks) {
            await addTrackToDB(track);
        }
    } catch (e) {
        console.error("Failed to add to DB", e);
    }
  };

  const handleUpdatePrompt = async (id: string, newPrompt: string) => {
    const track = tracks.find(t => t.id === id);
    if (!track) return;

    const updatedTrack = { ...track, prompt: newPrompt };
    
    setTracks(prev => prev.map(t => t.id === id ? updatedTrack : t));
    
    try {
        await updateTrackInDB(updatedTrack);
    } catch (e) {
        console.error("Failed to update DB", e);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm("Are you sure you want to delete this track permanently?")) return;

    try {
      await deleteTrackFromDB(id);
      
      // Update local state
      setTracks(prev => prev.filter(t => t.id !== id));
      setMixingQueue(prev => prev.filter(tid => tid !== id));
      
      // If we are currently viewing this track, go back to library
      if (view === 'track-detail' && currentTrackId === id) {
        setView('library');
        setCurrentTrackId(null);
      }
    } catch (e) {
      console.error("Failed to delete track", e);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleQueue = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMixingQueue(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const viewTrack = (id: string) => {
    setCurrentTrackId(id);
    setView('track-detail');
  };

  // --- Rendering ---

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center text-slate-500 flex-col gap-2">
                <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full"></div>
                <span className="text-xs uppercase tracking-widest text-amber-500">Initializing Core...</span>
            </div>
        )
    }

    switch (view) {
      case 'library':
        return (
          <LibraryView 
            tracks={tracks}
            selectedTags={selectedTags}
            mixingQueue={mixingQueue}
            onToggleTag={toggleTag}
            onSelectTrack={viewTrack}
            onToggleQueue={toggleQueue}
            onDeleteTrack={handleDeleteTrack}
          />
        );
      case 'track-detail':
        const track = tracks.find(t => t.id === currentTrackId);
        if (!track) {
          setView('library');
          return null;
        }
        return (
          <TrackDetailView 
            track={track}
            allTracks={tracks}
            mixingQueue={mixingQueue}
            onBack={() => setView('library')}
            onSelectTrack={viewTrack}
            onToggleQueue={toggleQueue}
            onUpdatePrompt={handleUpdatePrompt}
            onDeleteTrack={handleDeleteTrack}
          />
        );
      case 'mixing-room':
        return (
          <MixingRoomView 
            tracks={tracks}
            queueIds={mixingQueue}
            onRemoveFromQueue={(id) => toggleQueue(id)}
            onClearQueue={() => setMixingQueue([])}
          />
        );
      default:
        return <div>Unknown View</div>;
    }
  };

  return (
    <div className="min-h-screen flex font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Sidebar */}
      <aside className="w-16 lg:w-64 border-r border-slate-900 bg-slate-950 flex flex-col fixed h-full z-30 transition-all duration-300">
        <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start border-b border-slate-900/50">
          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded flex items-center justify-center bg-slate-900 border border-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Disc className="w-5 h-5 lg:w-6 lg:h-6 animate-[spin_10s_linear_infinite]" />
          </div>
          <h1 className="hidden lg:block ml-3 font-bold text-lg tracking-tight text-slate-200">
            Sonic<span className="text-amber-500">Alchemy</span>
          </h1>
        </div>

        <nav className="flex-1 mt-6 space-y-1 px-2">
          <button 
            onClick={() => setView('library')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${view === 'library' || view === 'track-detail' ? 'text-amber-500 bg-slate-900' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            {view === 'library' || view === 'track-detail' ? <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div> : null}
            <LayoutGrid className="w-5 h-5 lg:mr-3 relative z-10" />
            <span className="hidden lg:inline font-medium text-sm tracking-wide relative z-10">Library</span>
          </button>
          
          <button 
            onClick={() => setView('mixing-room')}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${view === 'mixing-room' ? 'text-amber-500 bg-slate-900' : 'text-slate-500 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            {view === 'mixing-room' ? <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div> : null}
            <div className="relative z-10">
              <FlaskConical className="w-5 h-5 lg:mr-3" />
              {mixingQueue.length > 0 && (
                <span className="absolute -top-1 -right-1 lg:right-2 lg:-top-1 w-3 h-3 bg-amber-600 rounded-full text-[8px] flex items-center justify-center text-white border border-slate-950">
                  {mixingQueue.length}
                </span>
              )}
            </div>
            <span className="hidden lg:inline font-medium text-sm tracking-wide relative z-10">Mixing Room</span>
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 space-y-3 border-t border-slate-900/50">
           <button 
             onClick={() => setIsModalOpen(true)}
             className="w-full bg-gradient-to-r from-slate-800 to-slate-800 hover:from-amber-600 hover:to-yellow-600 text-slate-300 hover:text-white p-3 rounded-lg shadow-lg flex items-center justify-center transition-all duration-300 group border border-slate-800 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
           >
             <Plus className="w-5 h-5 lg:mr-2 transition-transform group-hover:rotate-90" />
             <span className="hidden lg:inline font-bold text-sm tracking-wide">Import</span>
           </button>
           
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="w-full flex items-center justify-center lg:justify-start p-2 text-slate-600 hover:text-slate-300 rounded transition-colors"
             title="Data & Settings"
           >
              <Settings className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline font-medium text-xs uppercase tracking-widest">System</span>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-16 lg:ml-64 bg-slate-950 min-h-screen relative overflow-x-hidden w-full">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="relative z-10 p-4 lg:p-8 w-full">
          {renderContent()}
        </div>
      </main>

      <AddTrackModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={handleImportTracks}
      />
      
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        trackCount={tracks.length}
        onDataImported={(newTracks) => {
            setTracks(newTracks);
            setSelectedTags([]);
            setMixingQueue([]);
        }}
        onDataCleared={() => {
            setTracks([]);
            setSelectedTags([]);
            setMixingQueue([]);
            setView('library');
        }}
      />
      
    </div>
  );
};

export default App;