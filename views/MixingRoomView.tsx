import React, { useState, useMemo } from 'react';
import { Track } from '../types';
import { generateRefinedPrompt, AlchemyMode } from '../services/geminiService';
import { X, Sparkles, RefreshCcw, Copy, FlaskConical, ShieldCheck, Zap, Biohazard } from 'lucide-react';

interface MixingRoomViewProps {
  tracks: Track[];
  queueIds: string[];
  onRemoveFromQueue: (id: string) => void;
  onClearQueue: () => void;
}

const MixingRoomView: React.FC<MixingRoomViewProps> = ({ tracks, queueIds, onRemoveFromQueue, onClearQueue }) => {
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
    setIsGenerating(true);
    setGeneratedPrompt(null); // Clear previous

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
    setIsGenerating(false);
  };

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
      <div className="lg:col-span-8 flex flex-col p-4 lg:p-6 relative rounded-lg border border-slate-800 bg-slate-900/30 order-1 lg:order-2 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black -z-10" />
        
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
          
          <div className="mb-6 text-center">
            <h2 className="text-xl font-serif text-slate-200 tracking-tight flex items-center justify-center gap-2">
                 <FlaskConical className="w-5 h-5 text-amber-600" /> 
                 Alchemical Synthesis
            </h2>
            <p className="text-slate-500 text-xs mt-1">Select a transmutation process to forge a new prompt.</p>
          </div>

          {/* 3-Level Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full mb-8">
            
            {/* Stabilize */}
            <button
                onClick={() => handleMix('stabilize')}
                disabled={isGenerating}
                className="group flex flex-col items-center justify-center p-4 rounded-lg border bg-slate-950/50 hover:bg-cyan-950/20 border-slate-800 hover:border-cyan-500/50 transition-all hover:-translate-y-1"
            >
                <div className="p-2 rounded-full bg-cyan-950/30 text-cyan-500 mb-2 group-hover:scale-110 transition-transform">
                    <ShieldCheck size={18} />
                </div>
                <span className="text-xs font-bold text-cyan-100 uppercase tracking-widest mb-1">Stabilize</span>
                <span className="text-[10px] text-cyan-500/60 text-center">High Coherence<br/>Min. Volatility</span>
            </button>

            {/* Synthesize */}
            <button
                onClick={() => handleMix('synthesize')}
                disabled={isGenerating}
                className="group flex flex-col items-center justify-center p-4 rounded-lg border bg-slate-950/50 hover:bg-amber-950/20 border-slate-800 hover:border-amber-500/50 transition-all hover:-translate-y-1 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="p-2 rounded-full bg-amber-950/30 text-amber-500 mb-2 group-hover:scale-110 transition-transform">
                    {isGenerating ? <RefreshCcw className="animate-spin" size={18} /> : <Zap size={18} />}
                </div>
                <span className="text-xs font-bold text-amber-100 uppercase tracking-widest mb-1">Synthesize</span>
                <span className="text-[10px] text-amber-500/60 text-center">Balanced Mix<br/>Standard Fusion</span>
            </button>

            {/* Mutate */}
            <button
                onClick={() => handleMix('mutate')}
                disabled={isGenerating}
                className="group flex flex-col items-center justify-center p-4 rounded-lg border bg-slate-950/50 hover:bg-rose-950/20 border-slate-800 hover:border-rose-500/50 transition-all hover:-translate-y-1"
            >
                <div className="p-2 rounded-full bg-rose-950/30 text-rose-500 mb-2 group-hover:scale-110 transition-transform">
                    <Biohazard size={18} />
                </div>
                <span className="text-xs font-bold text-rose-100 uppercase tracking-widest mb-1">Mutate</span>
                <span className="text-[10px] text-rose-500/60 text-center">High Chaos<br/>Experimental</span>
            </button>
          </div>

          {/* Result Area */}
          {generatedPrompt && (
            <div className="w-full animate-in slide-in-from-bottom-2 fade-in duration-500">
                <div className="bg-slate-950 border border-amber-900/30 rounded-lg p-6 relative shadow-2xl">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-900 via-amber-600 to-rose-900 opacity-50 rounded-t-lg"></div>
                    
                    <p className="text-base text-slate-300 font-serif leading-relaxed italic text-center mb-4 selection:bg-amber-500/30">
                        "{generatedPrompt}"
                    </p>
                    
                    <div className="flex justify-center">
                        <button 
                            onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                            className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-full border border-slate-800 transition-colors"
                        >
                            <Copy size={12} /> Copy Result
                        </button>
                    </div>
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MixingRoomView;