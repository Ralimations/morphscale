
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import GhostCamera from './components/GhostCamera';
import Gallery from './components/Gallery';
import { dbService } from './services/db';
import { AppTab, WeightLog, AppSettings, PhotoEntry } from './types';
import { Plus, Trash2, ChevronRight, Scale, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [newLogData, setNewLogData] = useState({ weight: '', photo: null as Blob | null });
  const [settings, setSettings] = useState<AppSettings>({
    height: 175,
    targetWeight: 75,
    unit: 'kg',
    ghostOpacity: 40,
    localOnly: true,
    optimizedStorage: true,
  });

  const loadData = useCallback(async () => {
    await dbService.init();
    const allLogs = await dbService.getAllLogs();
    setLogs(allLogs);
    
    const savedSettings = localStorage.getItem('morphscale_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Instantly open camera when the Camera tab is selected
  useEffect(() => {
    if (activeTab === AppTab.CAMERA) {
      setIsCameraOpen(true);
    }
  }, [activeTab]);

  const handleSaveLog = async () => {
    if (!newLogData.weight) return;

    const weightNum = parseFloat(newLogData.weight);
    const photoId = newLogData.photo ? `p-${Date.now()}` : undefined;
    
    // Simple BMI: weight (kg) / [height (m)]^2
    const heightM = settings.height / 100;
    const bmi = heightM > 0 ? weightNum / (heightM * heightM) : 0;

    const newLog: WeightLog = {
      id: `l-${Date.now()}`,
      date: Date.now(),
      weight: weightNum,
      unit: settings.unit,
      photoId,
      bmi,
    };

    if (newLogData.photo && photoId) {
      const photo: PhotoEntry = {
        id: photoId,
        blob: newLogData.photo,
        timestamp: Date.now(),
      };
      await dbService.savePhoto(photo);
    }

    await dbService.saveLog(newLog);
    setIsLogging(false);
    setNewLogData({ weight: '', photo: null });
    
    // After logging from the direct camera tab, go to history
    if (activeTab === AppTab.CAMERA) {
      setActiveTab(AppTab.LOGS);
    }
    
    loadData();
  };

  const handleDeleteLog = async (id: string, photoId?: string) => {
    if (confirm("Permanently delete this entry?")) {
      await dbService.deleteLog(id, photoId);
      loadData();
    }
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    localStorage.setItem('morphscale_settings', JSON.stringify(updated));
  };

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.DASHBOARD:
        return <Dashboard logs={logs} settings={settings} />;
      case AppTab.GALLERY:
        return <Gallery />;
      case AppTab.LOGS:
        return (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-outfit font-bold">History</h2>
              <button 
                onClick={() => setIsLogging(true)}
                className="bg-emerald-500/10 text-emerald-400 p-2 px-4 rounded-xl border border-emerald-500/20 text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform"
              >
                Log New
              </button>
            </div>
            <div className="space-y-3">
              {logs.map(log => (
                <div key={log.id} className="bg-zinc-900/40 rounded-2xl p-4 border border-white/5 flex items-center justify-between group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 overflow-hidden border border-white/5">
                      {log.photoId ? (
                         <PhotoPreview photoId={log.photoId} />
                      ) : (
                        <Scale size={20} />
                      )}
                    </div>
                    <div>
                      <div className="text-lg font-outfit font-bold">{log.weight} {log.unit}</div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        {new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteLog(log.id, log.photoId)}
                    className="p-2 text-zinc-700 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="py-12 text-center text-zinc-500 text-sm">No entries yet.</div>
              )}
            </div>
          </div>
        );
      case AppTab.CAMERA:
        // Return null here because the camera renders as a global overlay.
        // We handle the auto-open via useEffect.
        return null;
      case AppTab.SETTINGS:
        return (
          <div className="p-6 space-y-8">
            <h2 className="text-xl font-outfit font-bold">Setup</h2>
            
            <div className="space-y-4">
              <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5 space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-400">Height (cm)</span>
                  <input 
                    type="number" 
                    value={settings.height} 
                    onChange={(e) => updateSettings({ height: parseInt(e.target.value) || 0 })}
                    className="bg-zinc-800 rounded-lg p-2 w-20 text-right font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-400">Target Weight</span>
                  <input 
                    type="number" 
                    value={settings.targetWeight} 
                    onChange={(e) => updateSettings({ targetWeight: parseInt(e.target.value) || 0 })}
                    className="bg-zinc-800 rounded-lg p-2 w-20 text-right font-bold text-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-400">Weight Unit</span>
                  <div className="flex bg-zinc-800 rounded-lg p-1">
                    <button 
                      onClick={() => updateSettings({ unit: 'kg' })}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${settings.unit === 'kg' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}
                    >
                      KG
                    </button>
                    <button 
                      onClick={() => updateSettings({ unit: 'lbs' })}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${settings.unit === 'lbs' ? 'bg-zinc-700 text-white' : 'text-zinc-500'}`}
                    >
                      LBS
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 rounded-2xl p-5 border border-white/5 space-y-5">
                 <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Local-Only Storage</span>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Privacy First</span>
                  </div>
                  <div className="w-12 h-6 bg-emerald-500 rounded-full flex items-center px-1">
                    <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex flex-col">
                    <span className="text-sm font-medium">Optimized Storage</span>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tight">Save Disk Space</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${settings.optimizedStorage ? 'bg-emerald-500' : 'bg-zinc-700'}`} onClick={() => updateSettings({optimizedStorage: !settings.optimizedStorage})}>
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.optimizedStorage ? 'ml-auto' : ''}`} />
                  </div>
                </div>
              </div>

              <button 
                onClick={async () => {
                  if(confirm("Erase all data? This cannot be undone.")) {
                    await dbService.clearAllData();
                    loadData();
                    alert("Data wiped.");
                  }
                }}
                className="w-full p-4 rounded-2xl border border-rose-500/20 text-rose-500 text-xs font-bold uppercase tracking-widest active:bg-rose-500/10 transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}

      {/* Log Entry Modal */}
      {isLogging && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsLogging(false)} />
          <div className="relative w-full bg-zinc-900 rounded-[2rem] border border-white/10 shadow-2xl p-8 space-y-8 animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-outfit font-bold">Log Progress</h3>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Weight ({settings.unit})</label>
                <input 
                  type="number"
                  placeholder="00.0"
                  autoFocus
                  value={newLogData.weight}
                  onChange={(e) => setNewLogData({...newLogData, weight: e.target.value})}
                  className="w-full bg-zinc-800 text-4xl font-outfit font-bold p-5 rounded-2xl text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Body Photo</label>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setIsCameraOpen(true)}
                    className="flex-1 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center border border-white/5 active:bg-zinc-700 transition-colors"
                  >
                    {newLogData.photo ? (
                      <div className="flex items-center space-x-2 text-emerald-400 font-bold uppercase tracking-tighter text-xs">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/20">
                           <PhotoPreviewFromBlob blob={newLogData.photo} />
                        </div>
                        <span>Photo Ready</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-zinc-500">
                        <Plus size={24} />
                        <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Add Photo</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsLogging(false)}
                  className="flex-1 bg-zinc-800 text-zinc-400 p-5 rounded-2xl font-bold uppercase tracking-widest active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveLog}
                  disabled={!newLogData.weight}
                  className="flex-[2] bg-emerald-500 text-white p-5 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-95 transition-all"
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Interface */}
      {isCameraOpen && (
        <GhostCamera 
          initialOpacity={settings.ghostOpacity}
          onCapture={(blob) => {
            setNewLogData({...newLogData, photo: blob});
            setIsCameraOpen(false);
            setIsLogging(true);
          }}
          onClose={() => {
            setIsCameraOpen(false);
            // If we came from the camera tab, return to dashboard on close
            if (activeTab === AppTab.CAMERA) {
              setActiveTab(AppTab.DASHBOARD);
            }
          }}
        />
      )}
    </Layout>
  );
};

// Helper component for photo previews in history list
const PhotoPreview: React.FC<{photoId: string}> = ({ photoId }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    dbService.getPhoto(photoId).then(photo => {
      if (photo && active) setUrl(URL.createObjectURL(photo.blob));
    });
    return () => { 
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [photoId]);

  if (!url) return <Scale size={20} className="text-zinc-700" />;
  return <img src={url} className="w-full h-full object-cover" />;
};

// Helper component for photo previews from a raw blob
const PhotoPreviewFromBlob: React.FC<{blob: Blob}> = ({ blob }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const newUrl = URL.createObjectURL(blob);
    setUrl(newUrl);
    return () => URL.revokeObjectURL(newUrl);
  }, [blob]);

  if (!url) return null;
  return <img src={url} className="w-full h-full object-cover" />;
};

export default App;
