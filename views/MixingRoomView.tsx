
import React, { useState, useMemo, useEffect } from 'react';
import { Track } from '../types';
import { generateRefinedPrompt, AlchemyMode } from '../services/geminiService';
import { X, Sparkles, RefreshCcw, Copy, FlaskConical, ShieldCheck, Zap, Biohazard, Loader2, Check, History, Clock } from 'lucide-react';

interface MixingRoomViewProps {
  tracks: Track[];
  queueIds: string[];
  onRemoveFromQueue: (id: string) => void;
  onClearQueue: () => void;
}

interface HistoryItem {
    id: string;
    prompt: string;
    mode: AlchemyMode;
    timestamp: number;
}

const MixingRoomView: React.FC<MixingRoomViewProps> = ({ tracks, queueIds, onRemoveFromQueue, onClearQueue }) => {
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  
  // Initialize history from Local Storage for persistence
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
        const saved = localStorage.getItem('alchemyHistory');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  // Save to Local Storage whenever history changes
  useEffect(() => {
    localStorage.setItem('alchemyHistory', JSON.stringify(history));
  }, [history]);
  
  // Track specifically WHICH mode is generating to animate the correct button
  const [generatingMode, setGeneratingMode] = useState<AlchemyMode | null>(null);
  
  // Copy feedback state
  const [isCopied, setIsCopied] = useState(false);

  const selectedTracks = useMemo(() => 
    tracks.filter(t => queueIds.includes(t.id)), 
  [tracks, queueIds]);

  const analysis = useMemo(() => {
    if (selectedTracks.length === 0) return null;

    const allTags = selectedTracks.flatMap(t => t.tags);
    const tagCounts: Record<string, number> = {};
    allTags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);

    // Identify common vs unique tags
    const threshold = Math.max(1, Math.ceil(selectedTracks.length * 0.5));
    
    const commonTags = Object.entries(tagCounts)
      .filter(([_, count]) => count >= threshold)
      .map(([tag]) => tag);

    const uniqueTags = Object.entries(tagCounts)
      .filter(([_, count]) => count < threshold)
      .map(([tag]) => tag);

    // Fallbacks if distribution is skewed
    let finalCommon = commonTags;
    let finalUnique = uniqueTags;

    if (finalCommon.length === 0) {
        const sorted = Object.entries(tagCounts).sort((a,b) => b[1] - a[1]);
        finalCommon = sorted.slice(0, 3).map(([t]) => t);
        finalUnique = sorted.slice(3).map(([t]) => t);
    }

    return { commonTags: finalCommon, uniqueTags: finalUnique };
  }, [selectedTracks]);

  const handleMix = async (mode: AlchemyMode) => {
    if (!analysis) return;
    setGeneratingMode(mode);
    setGeneratedPrompt(null); // Clear previous temporarily (optional)

    const { commonTags, uniqueTags } = analysis;
    
    // Determine spice level based on mode
    let spiceCount = 0;
    if (mode === 'stabilize') spiceCount = 1;      // Minimal spice
    if (mode === 'synthesize') spiceCount = 3;     // Balanced
    if (mode === 'mutate') spiceCount = 6;         // Chaotic

    // Pick random spice
    const shuffledUnique = [...uniqueTags].sort(() => 0.5 - Math.random());
    const randomSpice = shuffledUnique.slice(0, spiceCount);
    
    // Call Service
    const polished = await generateRefinedPrompt(commonTags, randomSpice, mode);
    
    setGeneratedPrompt(polished);
    
    // Add to history
    const newItem: HistoryItem = {
        id: Date.now().toString(),
        prompt: polished,
        mode: mode,
        timestamp: Date.now()
    };
    setHistory(prev => [newItem, ...prev].slice(0, 10)); // Keep last 10
    
    setGeneratingMode(null);
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClearHistory = () => {
    if(confirm("Clear local alchemy history?")) {
        setHistory([]);
    }
  }

  if (selectedTracks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full border border-slate-800 flex items-center justify-center bg-slate-900/50">
           <FlaskConical className="w-8 h-8 opacity-30" />
        </div>
        <div className="text-center">
            <p className="text-lg font-light text-slate-400">The Crucible is Empty</p>
            <p className="text-xs mt-2 text-slate-600">Select tracks from the library to begin transmutation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full pb-20 lg:pb-0">
      
      {/* Left: Ingredients Panel */}
      <div className="lg:col-span-4 flex flex-col h-[40vh] lg:h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden order-2 lg:order-1">
        <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h2 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center">
            Ingredients ({selectedTracks.length})
          </h2>
          <button onClick={onClearQueue} className="text-[9px] text-red-500 hover:text-red-400 uppercase tracking-wider font-semibold border border-red-900/30 px-2 py-0.5 rounded hover:bg-red-900/10 transition-colors">
            Clear
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {selectedTracks.map(track => (
            <div key={track.id} className="flex items-center bg-slate-950 p-2 rounded border border-slate-800/50 group hover:border-amber-900/50 transition-all">
              <img src={track.coverUrl} className="w-8 h-8 rounded-sm object-cover opacity-70 group-hover:opacity-100" alt="" />
              <div className="ml-3 flex-1 min-w-0">
                <h4 className="font-medium text-xs text-slate-300 truncate group-hover:text-amber-100">{track.title}</h4>
                <div className="flex gap-1 overflow-hidden mt-0.5">
                  {track.tags.slice(0,3).map(t => (
                    <span key={t} className="text-[9px] text-slate-500">{t}</span>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => onRemoveFromQueue(track.id)}
                className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        
        {/* DNA Analysis */}
        {analysis && (
          <div className="p-3 bg-slate-950 border-t border-slate-800">
            <h3 className="text-[9px] font-bold text-slate-500 uppercase mb-2 flex justify-between">
                <span>Core Essence</span>
                <span>Volatile Elements</span>
            </h3>
            <div className="flex flex-wrap gap-1">
              {analysis.commonTags.map(t => (
                <span key={t} className="text-[9px] bg-amber-950/20 text-amber-500 border border-amber-900/30 px-1.5 py-0.5 rounded">
                  {t}
                </span>
              ))}
              <div className="w-full border-b border-slate-800/50 my-1"></div>
              {analysis.uniqueTags.slice(0, 8).map(t => (
                <span key={t} className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-transparent">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Transmutation Controls (Compact) */}
      <div className="lg:col-span-8 flex flex-col p-4 lg:p-6 relative rounded-lg border border-slate-800 bg-slate-900/30 order-1 lg:order-2 overflow-hidden h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black -z-10" />
        
        <div className="flex-1 flex flex-col w-full max-w-2xl mx-auto overflow-y-auto custom-scrollbar pr-2">
          
          <div className="mb-6 text-center shrink-0">
            <h2 className="text-xl font-serif text-slate-200 tracking-tight flex items-center justify-center gap-2">
                 <FlaskConical className="w-5 h-5 text-amber-600" /> 
                 Alchemical Synthesis
            </h2>
            <p className="text-slate-500 text-xs mt-1">Select a transmutation process to forge a new prompt.</p>
          </div>

          {/* 3-Level Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full mb-8 shrink-0">
            
            {/* Stabilize */}
            <button
                onClick={() => handleMix('stabilize')}
                disabled={generatingMode !== null}
                className={`group flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:-translate-y-1 ${
                    generatingMode === 'stabilize' 
                    ? 'bg-cyan-950/30 border-cyan-500/50 cursor-wait' 
                    : 'bg-slate-950/50 hover:bg-cyan-950/20 border-slate-800 hover:border-cyan-500/50 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed'
                }`}
            >
                <div className="p-2 rounded-full bg-cyan-950/30 text-cyan-500 mb-2 group-hover:scale-110 transition-transform">
                    {generatingMode === 'stabilize' ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                </div>
                <span className="text-xs font-bold text-cyan-100 uppercase tracking-widest mb-1">Stabilize</span>
                <span className="text-[10px] text-cyan-500/60 text-center">High Coherence<br/>Min. Volatility</span>
            </button>

            {/* Synthesize */}
            <button
                onClick={() => handleMix('synthesize')}
                disabled={generatingMode !== null}
                className={`group flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:-translate-y-1 relative overflow-hidden ${
                    generatingMode === 'synthesize'
                    ? 'bg-amber-950/30 border-amber-500/50 cursor-wait'
                    : 'bg-slate-950/50 hover:bg-amber-950/20 border-slate-800 hover:border-amber-500/50 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed'
                }`}
            >
                <div className={`absolute inset-0 bg-amber-500/5 opacity-0 transition-opacity ${generatingMode === 'synthesize' ? 'opacity-100' : 'group-hover:opacity-100'}`}></div>
                <div className="p-2 rounded-full bg-amber-950/30 text-amber-500 mb-2 group-hover:scale-110 transition-transform">
                    {generatingMode === 'synthesize' ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                </div>
                <span className="text-xs font-bold text-amber-100 uppercase tracking-widest mb-1">Synthesize</span>
                <span className="text-[10px] text-amber-500/60 text-center">Balanced Mix<br/>Standard Fusion</span>
            </button>

            {/* Mutate */}
            <button
                onClick={() => handleMix('mutate')}
                disabled={generatingMode !== null}
                className={`group flex flex-col items-center justify-center p-4 rounded-lg border transition-all hover:-translate-y-1 ${
                    generatingMode === 'mutate'
                    ? 'bg-rose-950/30 border-rose-500/50 cursor-wait'
                    : 'bg-slate-950/50 hover:bg-rose-950/20 border-slate-800 hover:border-rose-500/50 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed'
                }`}
            >
                <div className="p-2 rounded-full bg-rose-950/30 text-rose-500 mb-2 group-hover:scale-110 transition-transform">
                    {generatingMode === 'mutate' ? <Loader2 className="animate-spin" size={18} /> : <Biohazard size={18} />}
                </div>
                <span className="text-xs font-bold text-rose-100 uppercase tracking-widest mb-1">Mutate</span>
                <span className="text-[10px] text-rose-500/60 text-center">High Chaos<br/>Experimental</span>
            </button>
          </div>

          {/* Result Area */}
          {generatedPrompt && (
            <div className="w-full animate-in slide-in-from-bottom-2 fade-in duration-500 shrink-0 mb-8">
                <div className="bg-slate-950 border border-amber-900/30 rounded-lg p-6 relative shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-900 via-amber-600 to-rose-900 opacity-50 rounded-t-lg"></div>
                    
                    <p className="text-base text-slate-300 font-serif leading-relaxed italic text-center mb-4 selection:bg-amber-500/30">
                        "{generatedPrompt}"
                    </p>
                    
                    <div className="flex justify-center">
                        <button 
                            onClick={() => handleCopy(generatedPrompt)}
                            className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest px-6 py-2 rounded-full border transition-all duration-300 ${
                                isCopied 
                                ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/50 scale-105' 
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                            }`}
                        >
                            {isCopied ? (
                                <>
                                    <Check size={14} className="stroke-[3]" /> Copied
                                </>
                            ) : (
                                <>
                                    <Copy size={12} /> Copy Result
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
          )}

          {/* History Section */}
          {history.length > 0 && (
             <div className="w-full mt-auto">
                 <div className="flex items-center justify-between mb-3 border-b border-slate-800/50 pb-2">
                    <div className="flex items-center gap-2">
                        <History size={14} className="text-slate-500"/>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Transmutations</span>
                    </div>
                    <button 
                        onClick={handleClearHistory}
                        className="text-[9px] text-slate-600 hover:text-red-500 hover:underline"
                    >
                        Clear History
                    </button>
                 </div>
                 <div className="space-y-2">
                     {history.map((item) => (
                         <div key={item.id} className="bg-slate-950/50 border border-slate-800 rounded p-3 flex items-start gap-3 hover:bg-slate-900 transition-colors group">
                             <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                 item.mode === 'stabilize' ? 'bg-cyan-500' : 
                                 item.mode === 'mutate' ? 'bg-rose-500' : 'bg-amber-500'
                             }`}></div>
                             <div className="flex-1 min-w-0">
                                 <p className="text-sm text-slate-400 font-serif italic truncate cursor-pointer hover:text-slate-200" onClick={() => setGeneratedPrompt(item.prompt)}>
                                     "{item.prompt}"
                                 </p>
                                 <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-2">
                                     <span className="uppercase">{item.mode}</span>
                                     <span>•</span>
                                     <span>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                                 </p>
                             </div>
                             <button 
                                onClick={() => handleCopy(item.prompt)}
                                className="text-slate-600 hover:text-amber-500 p-1 rounded opacity-0 group-hover:opacity-100 transition-all"
                             >
                                 <Copy size={12} />
                             </button>
                         </div>
                     ))}
                 </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MixingRoomView;
