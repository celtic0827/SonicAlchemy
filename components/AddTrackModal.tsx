
import React, { useState, useRef, useCallback } from 'react';
import { X, Sparkles, Loader2, Upload, Music, Trash2, AlertCircle } from 'lucide-react';
import { extractTagsFromPrompt } from '../services/geminiService';

interface TrackDraft {
  id: string; // temporary id
  file: File;
  title: string;
  prompt: string;
  tags: string[];
  audioUrl?: string; // base64
  isProcessingAudio: boolean;
  isTagging: boolean;
}

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tracks: { title: string; prompt: string; tags: string[]; audioUrl?: string }[]) => void;
}

const MAX_FILES = 10;

const AddTrackModal: React.FC<AddTrackModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [drafts, setDrafts] = useState<TrackDraft[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // --- File Processing ---

  const processFiles = async (files: File[]) => {
    setGlobalError(null);
    const validFiles = files.filter(f => f.type.startsWith('audio/'));
    
    if (validFiles.length === 0) return;

    const currentCount = drafts.length;
    if (currentCount + validFiles.length > MAX_FILES) {
      setGlobalError(`You can only import up to ${MAX_FILES} tracks at once.`);
      return;
    }

    const newDrafts: TrackDraft[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      title: file.name.replace(/\.[^/.]+$/, ""), // remove extension
      prompt: '', // User needs to input this
      tags: [],
      isProcessingAudio: true,
      isTagging: false,
    }));

    setDrafts(prev => [...prev, ...newDrafts]);

    // Process Audio to Base64 asynchronously
    newDrafts.forEach(draft => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDrafts(prev => prev.map(d => {
          if (d.id === draft.id) {
            return { 
              ...d, 
              audioUrl: e.target?.result as string, 
              isProcessingAudio: false 
            };
          }
          return d;
        }));
      };
      reader.readAsDataURL(draft.file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  // --- Drag & Drop ---

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  // --- Item Management ---

  const updateDraft = (id: string, updates: Partial<TrackDraft>) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const removeDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const handleSmartTagging = async (id: string, prompt: string) => {
    if (!prompt) return;
    updateDraft(id, { isTagging: true });
    const extracted = await extractTagsFromPrompt(prompt);
    updateDraft(id, { isTagging: false, tags: extracted });
  };

  // --- Submit ---

  const handleSubmit = () => {
    // Validation: Check if all have titles and prompts
    const incomplete = drafts.find(d => !d.title.trim() || !d.prompt.trim());
    if (incomplete) {
      setGlobalError("All tracks must have a Title and a Prompt.");
      return;
    }

    const payload = drafts.map(d => ({
      title: d.title,
      prompt: d.prompt,
      tags: d.tags.length > 0 ? d.tags : d.prompt.split(',').map(s => s.trim()).filter(Boolean),
      audioUrl: d.audioUrl
    }));

    onAdd(payload);
    
    // Reset
    setDrafts([]);
    setGlobalError(null);
    onClose();
  };

  // --- Render ---

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-amber-500/20 w-full max-w-5xl rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-900 flex justify-between items-center bg-slate-950 rounded-t-2xl z-10">
          <h2 className="text-2xl font-light text-slate-100 flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-slate-900 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
              <PlusIcon size={20} />
            </span>
            <span>Import Audio</span>
            <span className="text-sm font-normal text-slate-500 ml-2 font-mono border border-slate-800 px-2 py-0.5 rounded">
              {drafts.length}/{MAX_FILES}
            </span>
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-amber-500 transition-colors">
            <X />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/50">
          
          {/* Upload Area */}
          {drafts.length < MAX_FILES && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
                border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300
                ${isDragging 
                  ? 'border-amber-500 bg-amber-900/10 scale-[1.01] shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                  : 'border-slate-800 hover:border-amber-500/50 hover:bg-slate-900'
                }
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="audio/*" 
                multiple 
                className="hidden" 
              />
              <Upload className={`w-12 h-12 mb-4 ${isDragging ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
              <div className="text-center">
                <span className={`font-medium text-lg tracking-wide ${isDragging ? 'text-amber-400' : 'text-slate-400'}`}>
                  {isDragging ? 'Release to upload' : 'Drop audio files here'}
                </span>
                <p className="text-slate-600 text-sm mt-2">MP3, WAV • Up to 10 files batch</p>
              </div>
            </div>
          )}

          {globalError && (
             <div className="bg-red-950/30 border border-red-900/50 text-red-400 p-4 rounded-lg flex items-center gap-3 text-sm">
               <AlertCircle className="w-5 h-5" />
               {globalError}
             </div>
          )}

          {/* Draft List */}
          <div className="space-y-4">
            {drafts.map((draft, index) => (
              <div key={draft.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-amber-900/50 flex flex-col lg:flex-row gap-6 animate-in slide-in-from-bottom-2 transition-colors">
                
                {/* Left: File Info */}
                <div className="lg:w-1/4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 border border-slate-800 ${draft.isProcessingAudio ? 'bg-slate-800' : 'bg-slate-950 text-amber-600'}`}>
                       {draft.isProcessingAudio ? <Loader2 className="animate-spin w-5 h-5 text-slate-500"/> : <Music className="w-5 h-5"/>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-300 truncate max-w-full font-medium" title={draft.file.name}>{draft.file.name}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5 font-mono">{(draft.file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <input 
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-amber-100 placeholder-slate-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 outline-none transition-all"
                    placeholder="Track Title"
                    value={draft.title}
                    onChange={(e) => updateDraft(draft.id, { title: e.target.value })}
                  />
                </div>

                {/* Middle: Prompt */}
                <div className="lg:flex-1 flex flex-col gap-3">
                  <div className="relative">
                    <textarea 
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-300 placeholder-slate-600 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 outline-none resize-none transition-all"
                      rows={2}
                      placeholder="Prompt: Describe the atmosphere, instruments, and mood..."
                      value={draft.prompt}
                      onChange={(e) => updateDraft(draft.id, { prompt: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => handleSmartTagging(draft.id, draft.prompt)}
                      disabled={!draft.prompt || draft.isTagging}
                      className="absolute right-2 bottom-2 text-[10px] flex items-center gap-1.5 bg-slate-900 text-amber-500 hover:text-amber-400 hover:bg-slate-800 px-2 py-1 rounded border border-slate-800 hover:border-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider font-bold"
                    >
                      {draft.isTagging ? <Loader2 className="animate-spin w-3 h-3"/> : <Sparkles className="w-3 h-3"/>}
                      Analyze
                    </button>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 min-h-[24px]">
                    {draft.tags.length > 0 ? (
                      draft.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-amber-950/30 text-amber-500 border border-amber-500/20 px-2 py-1 rounded uppercase tracking-wide">
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-700 text-xs italic flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                        Tags generated from prompt
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-start justify-end">
                  <button 
                    onClick={() => removeDraft(draft.id)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-900/30"
                    title="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-900 bg-slate-950 rounded-b-2xl z-10 flex justify-end gap-4">
           <button 
             onClick={onClose}
             className="px-6 py-3 text-slate-400 hover:text-white font-medium transition-colors text-sm uppercase tracking-widest"
           >
             Cancel
           </button>
           <button 
            onClick={handleSubmit}
            disabled={drafts.length === 0}
            className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-600 text-slate-950 font-bold py-3 px-8 rounded-lg transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 disabled:hover:scale-100 uppercase tracking-widest text-sm"
          >
            Import Records
          </button>
        </div>

      </div>
    </div>
  );
};

// Helper icon since Plus is used in header
const PlusIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

export default AddTrackModal;
