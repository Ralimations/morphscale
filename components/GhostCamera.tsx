
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera as CameraIcon, FlipHorizontal, SlidersHorizontal, Grid, X } from 'lucide-react';
import { dbService } from '../services/db';

interface GhostCameraProps {
  onCapture: (blob: Blob) => void;
  onClose: () => void;
  initialOpacity: number;
}

const GhostCamera: React.FC<GhostCameraProps> = ({ onCapture, onClose, initialOpacity }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lastPhotoUrl, setLastPhotoUrl] = useState<string | null>(null);
  const [opacity, setOpacity] = useState(initialOpacity);
  const [showGrid, setShowGrid] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: isFrontCamera ? 'user' : 'environment',
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: false,
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Please allow camera access to use MorphScale.");
    }
  }, [isFrontCamera]);

  useEffect(() => {
    startCamera();
    
    // Load last photo for ghost overlay
    const fetchLastPhoto = async () => {
      const logs = await dbService.getAllLogs();
      const photoLog = logs.find(l => l.photoId);
      if (photoLog && photoLog.photoId) {
        const photo = await dbService.getPhoto(photoLog.photoId);
        if (photo) {
          setLastPhotoUrl(URL.createObjectURL(photo.blob));
        }
      }
    };
    fetchLastPhoto();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    
    // Flip if front camera
    if (isFrontCamera) {
      context.translate(canvasRef.current.width, 0);
      context.scale(-1, 1);
    }
    
    context.drawImage(videoRef.current, 0, 0);
    
    canvasRef.current.toBlob((blob) => {
      if (blob) onCapture(blob);
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col max-w-md mx-auto">
      {/* Viewfinder */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${isFrontCamera ? 'scale-x-[-1]' : ''}`}
        />
        
        {/* Ghost Overlay */}
        {lastPhotoUrl && (
          <img 
            src={lastPhotoUrl} 
            alt="Ghost Overlay"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            style={{ opacity: opacity / 100 }}
          />
        )}

        {/* Grid Lines */}
        {showGrid && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="border border-white/20" />
            ))}
          </div>
        )}

        {/* Controls Overlay (Top) */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
          <button 
            onClick={onClose}
            className="p-3 bg-black/40 backdrop-blur-lg rounded-full text-white pointer-events-auto active:scale-90 transition-transform"
          >
            <X size={24} />
          </button>
          
          <div className="flex flex-col space-y-4 items-end pointer-events-auto">
            <button 
              onClick={() => setShowGrid(!showGrid)}
              className={`p-3 rounded-full backdrop-blur-lg active:scale-90 transition-all ${showGrid ? 'bg-emerald-500 text-white' : 'bg-black/40 text-white/70'}`}
            >
              <Grid size={24} />
            </button>
            <button 
              onClick={() => setIsFrontCamera(!isFrontCamera)}
              className="p-3 bg-black/40 backdrop-blur-lg rounded-full text-white active:scale-90 transition-transform"
            >
              <FlipHorizontal size={24} />
            </button>
          </div>
        </div>

        {/* Footer Controls */}
        <div className="absolute bottom-12 left-0 right-0 px-8 flex flex-col items-center space-y-8">
          {/* Opacity Slider */}
          <div className="w-full max-w-[240px] flex items-center space-y-1 bg-black/40 backdrop-blur-xl p-3 px-5 rounded-2xl border border-white/10">
            <SlidersHorizontal size={18} className="text-white/60 mr-4" />
            <input 
              type="range"
              min="0"
              max="100"
              value={opacity}
              onChange={(e) => setOpacity(parseInt(e.target.value))}
              className="flex-1 accent-emerald-400 h-1 rounded-lg bg-white/20 appearance-none cursor-pointer"
            />
            <span className="ml-4 text-[10px] font-bold text-white/80 w-8">{opacity}%</span>
          </div>

          <button 
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent active:scale-95 transition-transform"
          >
            <div className="w-16 h-16 rounded-full bg-white shadow-lg" />
          </button>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default GhostCamera;
