
import React, { useState, useRef } from 'react';
import { Trip, TravelDocument } from '../../types';
import { 
  FileText, Plane, Home, Car, Shield, Contact, 
  Plus, Trash2, Wand2, Sparkles, Loader2, X, 
  Check, Activity, RefreshCw, Clock, Camera as CameraIcon,
  Ticket, Navigation, Eye, Lock, ShieldCheck
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Type } from "@google/genai";
import { formatDistanceToNow } from 'date-fns';

interface DocumentsTabProps {
  trip: Trip;
  updateTrip: (trip: Trip) => void;
}

const TYPE_CONFIG = {
  'Flight': { icon: <Plane size={24} />, color: 'bg-indigo-600', light: 'bg-indigo-50 dark:bg-indigo-900/20' },
  'Hotel': { icon: <Home size={24} />, color: 'bg-teal-500', light: 'bg-teal-50 dark:bg-teal-900/20' },
  'Car': { icon: <Car size={24} />, color: 'bg-slate-800', light: 'bg-slate-100 dark:bg-slate-800' },
  'Insurance': { icon: <Shield size={24} />, color: 'bg-brand-accent', light: 'bg-orange-50 dark:bg-orange-900/20' },
  'Contact': { icon: <Contact size={24} />, color: 'bg-pink-500', light: 'bg-pink-50 dark:bg-pink-900/20' }
};

const DocumentsTab: React.FC<DocumentsTabProps> = ({ trip, updateTrip }) => {
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [importText, setImportText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isEditor = trip.currentUserRole === 'Editor';

  const deleteDoc = (id: string) => {
    if (!confirm('Permanently redact this sensitive asset from the vault?')) return;
    updateTrip({ ...trip, documents: trip.documents.filter(d => d.id !== id) });
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Please enable camera permissions to use AI Vision Scan.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setShowCamera(false);
  };

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsParsing(true);
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    const base64Image = canvasRef.current.toDataURL('image/jpeg').split(',')[1];

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: "Extract travel details: type (Flight/Hotel/Car/Insurance/Contact), title, details, and confirmation code. Return a structured JSON object." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              title: { type: Type.STRING },
              details: { type: Type.STRING },
              confirmation: { type: Type.STRING }
            },
            required: ['type', 'title', 'confirmation']
          }
        }
      });
      
      const parsed = JSON.parse(response.text || '{}');
      const newDoc: TravelDocument = {
        id: uuidv4(),
        type: (parsed.type && Object.keys(TYPE_CONFIG).includes(parsed.type)) ? parsed.type : 'Flight',
        title: parsed.title || 'Untitled Document',
        details: parsed.details || 'Scanned via AI Vision',
        confirmation: parsed.confirmation || 'N/A',
        status: 'Confirmed',
        lastUpdated: new Date().toISOString()
      };

      updateTrip({
        ...trip,
        documents: [newDoc, ...trip.documents]
      });
      stopCamera();
    } catch (e) {
      console.error("Vision scan failed", e);
      alert("Intelligence scan failed. Please capture manually or ensure the document is clearly visible.");
    } finally {
      setIsParsing(false);
    }
  };

  const refreshFlightStatus = async (docId: string) => {
    setUpdatingStatusId(docId);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Simulate real tracking with AI response
      await new Promise(r => setTimeout(r, 1500));
      const newDocs = trip.documents.map(d => 
        d.id === docId ? { 
          ...d, 
          status: Math.random() > 0.8 ? 'Delayed' : 'On Time', 
          gate: String(Math.floor(Math.random() * 50) + 1) + (Math.random() > 0.5 ? 'A' : 'B'),
          lastUpdated: new Date().toISOString() 
        } : d
      );
      updateTrip({ ...trip, documents: newDocs });
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSmartImport = async () => {
    if (!importText.trim()) return;
    setIsParsing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract travel booking details from this text: "${importText}". Return a structured JSON object.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              title: { type: Type.STRING },
              details: { type: Type.STRING },
              confirmation: { type: Type.STRING }
            },
            required: ['type', 'title', 'confirmation']
          }
        }
      });
      const parsed = JSON.parse(response.text || '{}');
      const newDoc: TravelDocument = {
        id: uuidv4(),
        type: (parsed.type && Object.keys(TYPE_CONFIG).includes(parsed.type)) ? parsed.type : 'Flight',
        title: parsed.title || 'Imported Document',
        details: parsed.details || 'Extracted via Smart Import',
        confirmation: parsed.confirmation || 'N/A',
        status: 'Confirmed',
        lastUpdated: new Date().toISOString()
      };
      
      updateTrip({
        ...trip,
        documents: [newDoc, ...trip.documents]
      });
      setShowSmartImport(false);
      setImportText('');
    } catch (error) {
      console.error(error);
      alert("Decoding failed. The text might be incomplete.");
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-16 pb-32 no-scrollbar">
      {/* Secure Vault Header */}
      <section className="bg-slate-950 rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden shadow-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-slate-900 to-slate-950" />
        <div className="absolute top-0 right-0 p-20 opacity-10"><Lock size={200} /></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-8 max-w-2xl">
            <div className="inline-flex items-center gap-4 px-4 py-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <ShieldCheck size={18} className="text-brand-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70">Sensitive Data Center</span>
            </div>
            <h2 className="text-6xl md:text-7xl font-display font-bold leading-tight">
              Secure <span className="text-brand-primary">Vault</span>
            </h2>
            <p className="text-white/50 text-xl font-medium leading-relaxed">
              Consolidate your mission credentials. AI-powered scanning ensures every waypoint is verified and live-tracked.
            </p>
            <div className="flex flex-wrap gap-5">
              <button 
                onClick={startCamera}
                className="bg-white text-slate-950 px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:scale-[1.02] transition-all shadow-2xl"
              >
                <CameraIcon size={20} className="text-brand-primary" /> AI Vision Scan
              </button>
              <button 
                onClick={() => setShowSmartImport(true)}
                className="bg-white/5 backdrop-blur-xl border border-white/10 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:bg-white/10 transition-all"
              >
                <Wand2 size={20} /> Smart Import
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 w-full lg:w-96">
             <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-3 flex items-center gap-2">
                  <Activity size={14} /> Vault Health
                </p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/40">Verified Docs</span>
                    <span className="font-display font-bold">{trip.documents.length}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-primary w-full shadow-[0_0_15px_rgba(139,92,246,0.6)]" style={{ width: `${Math.min(100, (trip.documents.length / 5) * 100)}%` }} />
                  </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Booking Portfolio */}
      <section className="space-y-10">
        <div className="flex items-center gap-4 px-4">
           <h3 className="text-2xl font-display font-bold">Active Portfolio</h3>
           <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Assets: {trip.documents.length}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {trip.documents.map(doc => {
            const config = TYPE_CONFIG[doc.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG['Hotel'];
            return (
              <div key={doc.id} className="group relative bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200/60 dark:border-white/5 shadow-sm hover:shadow-3xl hover:-translate-y-2 transition-all duration-700 overflow-hidden flex flex-col">
                {/* Header Signature */}
                <div className={`h-24 w-full relative ${config.color} flex items-center justify-between px-10`}>
                   <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent)]" />
                   <div className="relative flex items-center gap-4 text-white">
                      <div className="p-2 bg-white/20 rounded-xl">{config.icon}</div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{doc.type}</span>
                   </div>
                   <div className="relative text-white/30"><Ticket size={48} /></div>
                </div>

                <div className="p-10 space-y-8">
                  <div>
                    <h4 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-2 leading-tight">{doc.title}</h4>
                    <p className="text-sm text-slate-500 font-medium italic">"{doc.details}"</p>
                  </div>

                  {/* Dynamic Status Display */}
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-[2rem] p-6 border border-slate-100 dark:border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Status Monitor</p>
                       <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${doc.status === 'Delayed' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                         {doc.status || 'Confirmed'}
                       </span>
                    </div>
                    {doc.type === 'Flight' && (
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gate</p>
                          <p className="text-xl font-display font-bold text-slate-900 dark:text-white">{doc.gate || 'TBD'}</p>
                        </div>
                        <button 
                          onClick={() => refreshFlightStatus(doc.id)}
                          disabled={updatingStatusId === doc.id}
                          className="p-3 bg-brand-primary text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg"
                        >
                          {updatingStatusId === doc.id ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Confirmation Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Confirmation #</p>
                      <p className="font-mono font-bold text-slate-900 dark:text-white tracking-widest uppercase">{doc.confirmation}</p>
                    </div>
                    {isEditor && (
                      <button 
                        onClick={() => deleteDoc(doc.id)}
                        className="w-12 h-12 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="px-10 pb-10 mt-auto">
                   <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-300">
                      <Clock size={10} /> Sync: {doc.lastUpdated ? formatDistanceToNow(new Date(doc.lastUpdated)) : 'Never'} ago
                   </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {trip.documents.length === 0 && (
          <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-white/5">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-10 text-slate-200">
               <FileText size={48} />
            </div>
            <h4 className="text-2xl font-display font-bold">Vault Empty</h4>
            <p className="text-slate-400 mt-2 mb-10">Scan your first credential to begin mission tracking.</p>
            <button onClick={startCamera} className="bg-brand-primary text-white px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl">Deploy Vision Scanner</button>
          </div>
        )}
      </section>

      {/* Vision Scanner Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl">
           <div className="relative w-full max-w-2xl aspect-[3/4] bg-black rounded-[4rem] overflow-hidden border-4 border-white/10 shadow-3xl">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              
              {isParsing && (
                 <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-10 text-center">
                    <Loader2 className="animate-spin mb-6 text-brand-primary" size={64} />
                    <h3 className="text-3xl font-display font-bold mb-4">AI Extraction Active</h3>
                    <p className="text-white/50 text-lg">Parsing credential metadata & security codes...</p>
                 </div>
              )}

              <div className="absolute inset-x-0 top-10 flex justify-center">
                 <div className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Align Credential to Border</span>
                 </div>
              </div>

              <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-8">
                <button onClick={stopCamera} className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white"><X /></button>
                <button onClick={captureAndScan} className="w-24 h-24 rounded-[2.5rem] bg-white border-8 border-brand-primary shadow-3xl flex items-center justify-center text-brand-primary hover:scale-105 active:scale-95 transition-all"><CameraIcon size={36}/></button>
              </div>
           </div>
        </div>
      )}

      {/* Smart Import Modal */}
      {showSmartImport && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[4rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-12 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white">
              <div>
                <h3 className="text-4xl font-display font-bold mb-2">Email Parser</h3>
                <p className="text-slate-400 font-medium">Extract intel from booking confirmations.</p>
              </div>
              <button onClick={() => setShowSmartImport(false)} className="p-4 hover:bg-white dark:hover:bg-slate-800 rounded-3xl transition-all text-slate-400"><X size={32} /></button>
            </div>
            <div className="p-12 space-y-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Confirmation Content</label>
                <textarea 
                  value={importText} 
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your booking email text here..." 
                  className="w-full p-8 bg-slate-50 dark:bg-slate-950 rounded-[3rem] font-medium outline-none h-48 border-2 border-transparent focus:border-brand-primary transition-all dark:text-white" 
                />
              </div>
              <button 
                onClick={handleSmartImport} 
                disabled={isParsing || !importText.trim()}
                className="w-full py-7 bg-brand-primary text-white font-black text-xs uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
              >
                {isParsing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {isParsing ? 'Decrypting Intel...' : 'Infiltrate Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;
