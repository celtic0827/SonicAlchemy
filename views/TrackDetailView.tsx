
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Track } from '../types';
import { ArrowLeft, Clock, Music, Tag as TagIcon, PlayCircle, PauseCircle, Pencil, Save, X, Trash2, Copy, Check, Activity } from 'lucide-react';
import TrackCard from '../components/TrackCard';
import AudioVisualizer from '../components/AudioVisualizer';

interface TrackDetailViewProps {
  track: Track;
  allTracks: Track[];
  mixingQueue: string[];
  onBack: () => void;
  onSelectTrack: (id: string) => void;
  onToggleQueue: (id: string, e: React.MouseEvent) => void;
  onUpdatePrompt: (id: string, newPrompt: string) => void;
  onDeleteTrack: (id: string) => void;
}

const TrackDetailView: React.FC<TrackDetailViewProps> = ({ 
  track, 
  allTracks, 
  mixingQueue,
  onBack, 
  onSelectTrack,
  onToggleQueue,
  onUpdatePrompt,
  onDeleteTrack
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(track.prompt);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setIsPlaying(false);
    setIsEditingPrompt(false);
    setEditedPrompt(track.prompt);
    if(audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [track.id, track.prompt]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSavePrompt = () => {
    if (editedPrompt.trim() !== "") {
      onUpdatePrompt(track.id, editedPrompt);
      setIsEditingPrompt(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(track.prompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const similarTracks = useMemo(() => {
    return allTracks
      .filter(t => t.id !== track.id)
      .map(t => {
        const intersection = t.tags.filter(tag => track.tags.includes(tag));
        return { ...t, overlapCount: intersection.length };
      })
      .filter(t => t.overlapCount > 0)
      .sort((a, b) => b.overlapCount - a.overlapCount)
      .slice(0, 5); // Limit to 5
  }, [track, allTracks]);

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500 pb-20 w-full">
      <div className="flex justify-between items-center mb-6">
        <button 
            onClick={onBack}
            className="flex items-center text-slate-500 hover:text-amber-500 transition-colors uppercase text-xs tracking-widest font-bold"
        >
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Library
        </button>

        <button 
            onClick={() => onDeleteTrack(track.id)}
            className="flex items-center text-slate-600 hover:text-red-500 transition-colors text-xs uppercase tracking-widest font-bold border border-transparent hover:border-red-900/30 hover:bg-red-950/10 px-3 py-1.5 rounded"
        >
            <Trash2 className="w-4 h-4 mr-2" /> Delete Record
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-16">
        {/* Left: Cover & Audio */}
        <div className="md:col-span-4 lg:col-span-3">
          <div className="aspect-square rounded shadow-2xl relative group bg-slate-900 border border-slate-800 overflow-hidden">
            <img 
              src={track.coverUrl} 
              alt={track.title} 
              className={`w-full h-full object-cover transition-all duration-700 ${isPlaying ? 'scale-105 opacity-60' : 'opacity-90'}`} 
            />
            
            <div 
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
            >
              <div className={`transition-all duration-500 ${isPlaying ? 'scale-100 opacity-100' : 'scale-90 opacity-0 group-hover:opacity-100'}`}>
                {isPlaying ? (
                  <PauseCircle className="w-20 h-20 text-amber-500 fill-amber-500/20 drop-shadow-xl"/>
                ) : (
                  <PlayCircle className="w-20 h-20 text-slate-200 fill-black/50 drop-shadow-xl hover:text-amber-400 hover:scale-105 transition-all"/>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 bg-slate-900/50 p-3 rounded border border-slate-800">
             {track.audioUrl ? (
                <>
                  <audio 
                    ref={audioRef} 
                    src={track.audioUrl} 
                    controls 
                    className="w-full h-8 accent-amber-500 mb-2"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                  {/* Visualizer */}
                  <div className="pt-2 border-t border-slate-800/50">
                    <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} />
                  </div>
                </>
             ) : (
                <div className="text-center text-slate-600 text-xs italic p-2">
                  No audio source
                </div>
             )}
          </div>
          
          {/* Audio Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4">
             <div className="bg-slate-900/50 p-3 rounded border border-slate-800 flex flex-col items-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Tempo</span>
                <span className="text-xl font-mono text-amber-500 flex items-center gap-1">
                   <Activity size={14} className="text-amber-700" />
                   {track.bpm ? track.bpm : '--'} <span className="text-[10px] text-slate-600">BPM</span>
                </span>
             </div>
             <div className="bg-slate-900/50 p-3 rounded border border-slate-800 flex flex-col items-center">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Format</span>
                <span className="text-sm font-mono text-slate-400 mt-1">MP3 / WAV</span>
             </div>
          </div>
        </div>

        {/* Right: Info */}
        <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-center">
          <h1 className="text-4xl lg:text-6xl font-thin text-white mb-2 tracking-tight break-words">{track.title}</h1>
          <div className="flex items-center text-slate-500 text-xs uppercase tracking-widest mb-8">
            <Clock className="w-3 h-3 mr-2" />
            Added {new Date(track.createdAt).toLocaleDateString()}
          </div>

          <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800 relative group/prompt hover:border-amber-900/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center">
                <Music className="w-3 h-3 mr-2" />
                Prompt DNA
              </h3>
              
              <div className="flex items-center gap-1 opacity-0 group-hover/prompt:opacity-100 transition-opacity">
                {/* Copy Button */}
                <button 
                  onClick={handleCopyPrompt}
                  className="p-1.5 text-slate-500 hover:text-amber-400 transition-all rounded hover:bg-slate-800"
                  title="Copy Prompt"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>

                {/* Edit Button */}
                {!isEditingPrompt && (
                  <button 
                    onClick={() => setIsEditingPrompt(true)}
                    className="p-1.5 text-slate-500 hover:text-amber-400 transition-all rounded hover:bg-slate-800"
                    title="Edit Prompt"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {isEditingPrompt ? (
              <div className="space-y-3">
                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/30 rounded p-3 text-slate-200 focus:ring-1 focus:ring-amber-500 outline-none resize-none font-serif text-lg"
                  rows={4}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => { setEditedPrompt(track.prompt); setIsEditingPrompt(false); }}
                    className="flex items-center px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSavePrompt}
                    className="flex items-center px-4 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded transition-colors shadow-lg shadow-amber-900/20"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-300 font-serif text-xl leading-relaxed opacity-90">"{track.prompt}"</p>
            )}
          </div>

          <div className="mt-6">
            <div className="flex flex-wrap gap-2">
              {track.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-400 rounded text-xs hover:border-amber-500/30 hover:text-amber-500 transition-colors cursor-default">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Music Section */}
      <section>
        <div className="flex items-center mb-6">
            <div className="h-px bg-slate-800 flex-1"></div>
            <h2 className="text-lg font-light text-slate-400 mx-4 uppercase tracking-widest">Resonant Tracks</h2>
            <div className="h-px bg-slate-800 flex-1"></div>
        </div>
        
        {similarTracks.length === 0 ? (
          <div className="text-center text-slate-600 italic py-10">No similar vibrations detected.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {similarTracks.map(t => (
              <div key={t.id} className="relative">
                <div className="absolute -top-2 -right-2 z-10 bg-amber-900 text-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-700/50 shadow-lg">
                  {t.overlapCount}
                </div>
                <TrackCard 
                  track={t} 
                  onClick={onSelectTrack}
                  isInMixingQueue={mixingQueue.includes(t.id)}
                  onToggleQueue={onToggleQueue}
                  onDelete={onDeleteTrack}
                  selectedTrackId={null} // Simplified for similar tracks view
                  playingTrackId={null}
                  isPlaying={false}
                  onPlay={() => {}} // No playback for similar cards
                  onPause={() => {}}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default TrackDetailView;
