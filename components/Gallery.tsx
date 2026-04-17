
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import { PhotoEntry, WeightLog } from '../types';
import { Play, Pause, Share2, Calendar, Loader2, X, ArrowRightLeft, Download, Check } from 'lucide-react';

const Gallery: React.FC = () => {
  const [photos, setPhotos] = useState<{blobUrl: string, date: number, weight: number}[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(5);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Side-by-Side state
  const [viewMode, setViewMode] = useState<'timelapse' | 'sidebyside'>('timelapse');
  const [indexA, setIndexA] = useState(0);
  const [indexB, setIndexB] = useState(1);
  const [isSelectingFor, setIsSelectingFor] = useState<'A' | 'B' | null>(null);
  const [isSavingComparison, setIsSavingComparison] = useState(false);
  
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const loadPhotos = async () => {
      const logs = await dbService.getAllLogs();
      const photoEntries = [];
      const sortedLogs = [...logs].reverse().filter(l => l.photoId);
      
      for (const log of sortedLogs) {
        if (log.photoId) {
          const photo = await dbService.getPhoto(log.photoId);
          if (photo) {
            photoEntries.push({
              blobUrl: URL.createObjectURL(photo.blob),
              date: log.date,
              weight: log.weight
            });
          }
        }
      }
      setPhotos(photoEntries);
      if (photoEntries.length >= 2) {
        setIndexA(0);
        setIndexB(photoEntries.length - 1);
      }
    };
    loadPhotos();

    return () => {
      photos.forEach(p => URL.revokeObjectURL(p.blobUrl));
    };
  }, []);

  useEffect(() => {
    if (isPlaying && photos.length > 0) {
      timerRef.current = window.setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
      }, 1000 / speed);
    } else {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, photos.length, speed]);

  const handleExport = async () => {
    if (photos.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportProgress(0);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const firstImg = new Image();
    firstImg.src = photos[0].blobUrl;
    await new Promise((resolve) => { firstImg.onload = resolve; });

    canvas.width = firstImg.naturalWidth || 1080;
    canvas.height = firstImg.naturalHeight || 1440;

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000
    });

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MorphScale_TimeLapse_${new Date().toISOString().split('T')[0]}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setIsExporting(false);
      setExportProgress(0);
    };

    recorder.start();

    for (let i = 0; i < photos.length; i++) {
      setExportProgress(Math.round(((i + 1) / photos.length) * 100));
      const img = new Image();
      img.src = photos[i].blobUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(40, 40, 320, 140);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.fillText(new Date(photos[i].date).toLocaleDateString(), 60, 90);
      
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 44px Outfit, sans-serif';
      ctx.fillText(`${photos[i].weight} kg`, 60, 150);

      await new Promise((resolve) => setTimeout(resolve, 1000 / speed));
    }

    recorder.stop();
  };

  const saveComparisonImage = async () => {
    if (photos.length < 2) return;
    setIsSavingComparison(true);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgA = new Image();
    const imgB = new Image();
    imgA.src = photos[indexA].blobUrl;
    imgB.src = photos[indexB].blobUrl;

    await Promise.all([
      new Promise(resolve => imgA.onload = resolve),
      new Promise(resolve => imgB.onload = resolve)
    ]);

    const photoWidth = imgA.naturalWidth || 1080;
    const photoHeight = imgA.naturalHeight || 1440;
    
    // Side by side canvas
    canvas.width = photoWidth * 2;
    canvas.height = photoHeight;

    // Draw images
    ctx.drawImage(imgA, 0, 0, photoWidth, photoHeight);
    ctx.drawImage(imgB, photoWidth, 0, photoWidth, photoHeight);

    // Styling for text overlay
    const drawOverlay = (label: string, date: number, weight: number, x: number) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(x + 20, 20, photoWidth - 40, 160);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px Outfit, sans-serif';
      ctx.fillText(label, x + 40, 70);
      
      ctx.font = '28px Outfit, sans-serif';
      ctx.fillText(new Date(date).toLocaleDateString(), x + 40, 115);
      
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 36px Outfit, sans-serif';
      ctx.fillText(`${weight} kg`, x + 40, 160);
    };

    drawOverlay("BEFORE", photos[indexA].date, photos[indexA].weight, 0);
    drawOverlay("AFTER", photos[indexB].date, photos[indexB].weight, photoWidth);

    // Branding
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, photoHeight - 80, canvas.width, 80);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 24px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MORPHSCALE - VISUAL TRANSFORMATION TRACKER', canvas.width / 2, photoHeight - 30);

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `MorphScale_Comparison_${new Date().getTime()}.png`;
    link.href = dataUrl;
    link.click();
    
    setIsSavingComparison(false);
  };

  const swapComparison = () => {
    const temp = indexA;
    setIndexA(indexB);
    setIndexB(temp);
  };

  if (photos.length < 2) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto border border-white/5">
          <Play size={32} className="text-zinc-600 ml-1" />
        </div>
        <h3 className="text-xl font-outfit font-bold">Not Enough Progress</h3>
        <p className="text-zinc-500 text-sm">You need at least 2 photos to generate a Morph time-lapse or comparison.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Selection Overlay */}
      {isSelectingFor && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setIsSelectingFor(null)} />
          <div className="relative w-full max-h-[80vh] bg-zinc-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-outfit font-bold">Select {isSelectingFor === 'A' ? 'Before' : 'After'} Photo</h3>
              <button onClick={() => setIsSelectingFor(null)} className="p-2 bg-zinc-800 rounded-full"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3">
              {photos.map((photo, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    if (isSelectingFor === 'A') setIndexA(i);
                    else setIndexB(i);
                    setIsSelectingFor(null);
                  }}
                  className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all ${
                    (isSelectingFor === 'A' && indexA === i) || (isSelectingFor === 'B' && indexB === i)
                      ? 'border-emerald-500 ring-4 ring-emerald-500/20' 
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={photo.blobUrl} className="w-full h-full object-cover" alt="" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-[10px] font-bold">
                    {new Date(photo.date).toLocaleDateString()}
                  </div>
                  {((isSelectingFor === 'A' && indexA === i) || (isSelectingFor === 'B' && indexB === i)) && (
                    <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1"><Check size={12} className="text-white"/></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main View Area */}
      {viewMode === 'timelapse' ? (
        <div className="relative aspect-[3/4] w-full bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10">
          <img 
            src={photos[currentIndex].blobUrl} 
            alt="Transformation"
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
            <div className="bg-black/40 backdrop-blur-md p-3 px-4 rounded-2xl border border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Date</div>
              <div className="text-sm font-outfit font-bold">{new Date(photos[currentIndex].date).toLocaleDateString()}</div>
            </div>
            <div className="bg-black/40 backdrop-blur-md p-3 px-4 rounded-2xl border border-white/10 text-right">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Weight</div>
              <div className="text-sm font-outfit font-bold">{photos[currentIndex].weight} kg</div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
            <div className="h-full bg-emerald-400 transition-all duration-200" style={{ width: `${((currentIndex + 1) / photos.length) * 100}%` }} />
          </div>
          {isExporting && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 z-50">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
              <div className="text-center">
                <h4 className="text-lg font-outfit font-bold">Generating Video</h4>
                <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold">{exportProgress}% Complete</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <div className="flex gap-2 h-[450px]">
            {/* Before Photo */}
            <div className="flex-1 relative bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/10 group cursor-pointer" onClick={() => setIsSelectingFor('A')}>
              <img src={photos[indexA].blobUrl} className="w-full h-full object-cover" alt="Before" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                 <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">BEFORE</span>
              </div>
              <div className="absolute bottom-4 left-4 pointer-events-none">
                 <div className="text-lg font-outfit font-bold">{photos[indexA].weight} <span className="text-xs text-zinc-400 uppercase">kg</span></div>
                 <div className="text-[10px] font-bold text-zinc-300 uppercase opacity-60">{new Date(photos[indexA].date).toLocaleDateString()}</div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20"><Calendar size={20}/></div>
              </div>
            </div>

            {/* After Photo */}
            <div className="flex-1 relative bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/10 group cursor-pointer" onClick={() => setIsSelectingFor('B')}>
              <img src={photos[indexB].blobUrl} className="w-full h-full object-cover" alt="After" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                 <span className="bg-cyan-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">AFTER</span>
              </div>
              <div className="absolute bottom-4 left-4 pointer-events-none">
                 <div className="text-lg font-outfit font-bold">{photos[indexB].weight} <span className="text-xs text-zinc-400 uppercase">kg</span></div>
                 <div className="text-[10px] font-bold text-zinc-300 uppercase opacity-60">{new Date(photos[indexB].date).toLocaleDateString()}</div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[2px]">
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20"><Calendar size={20}/></div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center -mt-8 relative z-10">
             <button onClick={swapComparison} className="p-4 bg-zinc-900 rounded-full border border-white/10 shadow-xl text-emerald-400 active:scale-90 transition-transform hover:bg-zinc-800">
               <ArrowRightLeft size={24} />
             </button>
          </div>
        </div>
      )}

      {/* Mode Selector & Controls */}
      <div className="bg-zinc-900/50 rounded-3xl p-6 border border-white/5 space-y-6">
        <div className="flex p-1 bg-zinc-800 rounded-2xl">
          <button 
            onClick={() => setViewMode('timelapse')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'timelapse' ? 'bg-zinc-700 text-emerald-400 shadow-sm' : 'text-zinc-500'}`}
          >
            Time-Lapse
          </button>
          <button 
            onClick={() => setViewMode('sidebyside')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'sidebyside' ? 'bg-zinc-700 text-emerald-400 shadow-sm' : 'text-zinc-500'}`}
          >
            Side-by-Side
          </button>
        </div>

        {viewMode === 'timelapse' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Frame {currentIndex + 1} of {photos.length}</span>
                <span className="text-lg font-outfit font-bold">{isPlaying ? 'Morphing...' : 'Paused'}</span>
              </div>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={isExporting}
                className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform disabled:opacity-50"
              >
                {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-zinc-500">
                <span>Speed</span>
                <span className="text-emerald-400">{speed} FPS</span>
              </div>
              <input 
                type="range" min="1" max="15" value={speed}
                onChange={(e) => setSpeed(parseInt(e.target.value))}
                disabled={isExporting}
                className="w-full accent-emerald-400 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
              />
            </div>
            <button 
              onClick={handleExport} disabled={isExporting}
              className="w-full flex items-center justify-center space-x-3 p-5 bg-zinc-800/50 rounded-2xl border border-white/5 text-zinc-100 font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-transform disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Share2 size={18} />}
              <span>{isExporting ? 'Exporting...' : 'Export Time-Lapse'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
               <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0"><Calendar size={18}/></div>
               <p className="text-[10px] font-medium text-zinc-400 leading-relaxed uppercase tracking-wider">Tap on the photos above to select different dates from your history for comparison.</p>
            </div>
            <button 
              onClick={saveComparisonImage}
              disabled={isSavingComparison}
              className="w-full flex items-center justify-center space-x-3 p-5 bg-emerald-500 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] active:scale-95 transition-transform shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSavingComparison ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
              <span>{isSavingComparison ? 'Saving...' : 'Download Comparison'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
