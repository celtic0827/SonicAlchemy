import React, { useState, useMemo } from 'react';
import { Track } from '../types';
import { generateRefinedPrompt } from '../services/geminiService';
import { X, Sparkles, Wand2, RefreshCcw, Copy, FlaskConical } from 'lucide-react';

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

    const threshold = Math.max(1, Math.ceil(selectedTracks.length * 0.5));
    
    const commonTags = Object.entries(tagCounts)
      .filter(([_, count]) => count >= threshold)
      .map(([tag]) => tag);

    const uniqueTags = Object.entries(tagCounts)
      .filter(([_, count]) => count < threshold)
      .map(([tag]) => tag);

    return { commonTags, uniqueTags };
  }, [selectedTracks]);

  const handleMix = async () => {
    if (!analysis) return;
    setIsGenerating(true);

    const { commonTags, uniqueTags } = analysis;
    const shuffledUnique = [...uniqueTags].sort(() => 0.5 - Math.random());
    const randomSelection = shuffledUnique.slice(0, 3);
    
    const basePromptList = [...commonTags, ...randomSelection];
    const basePromptString = basePromptList.join(', ');

    const polished = await generateRefinedPrompt(basePromptString);
    setGeneratedPrompt(polished);
    setIsGenerating(false);
  };

  if (selectedTracks.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-6">
        <div className="w-24 h-24 rounded-full border border-slate-800 flex items-center justify-center bg-slate-900/50">
           <FlaskConical className="w-10 h-10 opacity-30" />
        </div>
        <div className="text-center">
            <p className="text-xl font-light text-slate-400">The Crucible is Empty</p>
            <p className="text-sm mt-2">Select tracks from the library to begin transmutation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-10">
      
      {/* Left: Ingredients */}
      <div className="lg:col-span-4 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h2 className="text-sm font-bold text-amber-500 uppercase tracking-widest flex items-center">
            Ingredients ({selectedTracks.length})
          </h2>
          <button onClick={onClearQueue} className="text-[10px] text-red-500 hover:text-red-400 uppercase tracking-wider font-semibold border border-red-900/30 px-2 py-1 rounded hover:bg-red-900/10 transition-colors">
            Empty Vessel
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {selectedTracks.map(track => (
            <div key={track.id} className="flex items-center bg-slate-950 p-2 rounded border border-slate-800/50 group hover:border-amber-900/50 transition-all">
              <img src={track.coverUrl} className="w-10 h-10 rounded-sm object-cover opacity-70 group-hover:opacity-100" alt="" />
              <div className="ml-3 flex-1 min-w-0">
                <h4 className="font-medium text-sm text-slate-300 truncate group-hover:text-amber-100">{track.title}</h4>
                <div className="flex gap-1 overflow-hidden mt-0.5">
                  {track.tags.slice(0,3).map(t => (
                    <span key={t} className="text-[9px] text-slate-500">{t}</span>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => onRemoveFromQueue(track.id)}
                className="p-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        
        {/* DNA */}
        {analysis && (
          <div className="p-4 bg-slate-950 border-t border-slate-800">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2">Extracted Elements</h3>
            <div className="flex flex-wrap gap-1.5">
              {analysis.commonTags.map(t => (
                <span key={t} className="text-[10px] bg-amber-900/20 text-amber-500 border border-amber-900/30 px-1.5 py-0.5 rounded">
                  {t}
                </span>
              ))}
              {analysis.uniqueTags.slice(0, 5).map(t => (
                <span key={t} className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded border border-transparent">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Transmutation */}
      <div className="lg:col-span-8 flex flex-col items-center justify-center p-8 relative rounded-lg border border-slate-800 bg-slate-900/30">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black -z-10" />
        
        <div className="w-full max-w-lg text-center">
          <div className="relative inline-block group">
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <Wand2 className="w-12 h-12 text-amber-600 mx-auto mb-6 relative z-10" />
          </div>
          
          <h2 className="text-3xl font-serif text-slate-200 mb-2">Alchemical Synthesis</h2>
          <p className="text-slate-500 mb-10 text-sm max-w-xs mx-auto">Combine selected elements to forge a new prompt creation.</p>

          <button
            onClick={handleMix}
            disabled={isGenerating}
            className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-slate-950 transition-all duration-300 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 rounded-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 border border-amber-400"
          >
            {isGenerating ? (
              <>
                <RefreshCcw className="w-5 h-5 mr-2 animate-spin" /> Transmuting...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" /> GENERATE
              </>
            )}
          </button>
        </div>

        {generatedPrompt && (
          <div className="mt-12 w-full max-w-2xl animate-in fade-in zoom-in duration-500">
            <div className="bg-slate-950 border border-amber-900/40 rounded p-8 shadow-2xl relative group">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-950 border border-amber-900/40 text-amber-500 text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
                Result
              </div>
              <p className="text-xl text-slate-300 leading-relaxed font-serif text-center italic">
                "{generatedPrompt}"
              </p>
              <div className="mt-6 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                <button 
                  onClick={() => navigator.clipboard.writeText(generatedPrompt)}
                  className="flex items-center text-xs text-amber-600 hover:text-amber-400 transition-colors uppercase tracking-widest font-bold"
                >
                  <Copy className="w-3 h-3 mr-2" /> Copy to clipboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MixingRoomView;