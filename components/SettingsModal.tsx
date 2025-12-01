
import React, { useRef, useState } from 'react';
import { X, Download, Upload, Trash2, CheckCircle, AlertTriangle, Loader2, Database } from 'lucide-react';
import { exportData, importData, clearDB } from '../services/db';
import { Track } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataImported: (tracks: Track[]) => void;
  onDataCleared: () => void;
  trackCount: number;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onDataImported, 
  onDataCleared,
  trackCount 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{type: 'success'|'error'|'info', text: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      const jsonStr = await exportData();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SonicAlchemy_Backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMsg({ type: 'success', text: 'Backup downloaded successfully.' });
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Export failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("This will replace your current library. Are you sure?")) {
        e.target.value = ''; // Reset input
        return;
    }

    try {
      setIsProcessing(true);
      const text = await file.text();
      const tracks = await importData(text);
      onDataImported(tracks);
      setStatusMsg({ type: 'success', text: `Restored ${tracks.length} tracks successfully.` });
    } catch (e) {
      console.error(e);
      setStatusMsg({ type: 'error', text: 'Import failed. Invalid file format.' });
    } finally {
      setIsProcessing(false);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = async () => {
    if (confirm("Are you sure you want to delete ALL tracks? This cannot be undone.")) {
      try {
        setIsProcessing(true);
        await clearDB();
        onDataCleared();
        setStatusMsg({ type: 'success', text: 'Library cleared.' });
      } catch (e) {
        setStatusMsg({ type: 'error', text: 'Reset failed.' });
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-amber-500/20 w-full max-w-md rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-1 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none rounded-2xl" />
        
        <div className="bg-slate-950 p-6 rounded-xl relative z-10">
            <button onClick={onClose} className="absolute top-5 right-5 text-slate-500 hover:text-amber-500 transition-colors">
            <X size={20} />
            </button>
            
            <h2 className="text-xl font-light mb-8 text-white flex items-center gap-3">
                <Database className="text-amber-500" size={20} />
                <span className="tracking-wide">System Management</span>
            </h2>

            <div className="space-y-4">
            
            <div className="bg-slate-900 p-5 rounded-lg border border-slate-800 flex flex-col items-center justify-center text-center">
                <span className="text-slate-500 text-xs uppercase tracking-widest mb-1">Total Records</span>
                <span className="text-3xl font-thin text-amber-500">{trackCount}</span>
                <p className="text-[10px] text-slate-600 mt-3 max-w-[200px]">
                Data is stored locally via IndexedDB. Export your data to secure it externally.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={handleExport}
                    disabled={isProcessing || trackCount === 0}
                    className="flex flex-col items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-slate-300 hover:text-amber-400 p-4 rounded-lg transition-all group"
                >
                    {isProcessing ? <Loader2 className="animate-spin w-5 h-5"/> : <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    <span className="text-xs font-bold uppercase tracking-wider">Backup</span>
                </button>

                <button 
                    onClick={handleImportClick}
                    disabled={isProcessing}
                    className="flex flex-col items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-slate-300 hover:text-amber-400 p-4 rounded-lg transition-all group"
                >
                    {isProcessing ? <Loader2 className="animate-spin w-5 h-5"/> : <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    <span className="text-xs font-bold uppercase tracking-wider">Restore</span>
                </button>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
            />

            <hr className="border-slate-900 my-2" />

            <button 
                onClick={handleReset}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 text-red-900 hover:text-red-500 hover:bg-red-950/10 py-3 rounded-lg transition-all text-xs font-bold uppercase tracking-widest border border-transparent hover:border-red-900/20"
            >
                <Trash2 className="w-4 h-4" />
                Factory Reset
            </button>

            {statusMsg && (
                <div className={`mt-4 p-3 rounded border flex items-center gap-3 text-xs ${
                    statusMsg.type === 'success' ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50' :
                    statusMsg.type === 'error' ? 'bg-red-950/30 text-red-400 border-red-900/50' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                    {statusMsg.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
                    {statusMsg.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
                    {statusMsg.text}
                </div>
            )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
