
import React, { useState, useRef, useEffect } from 'react';
import { Trip, TravelDocument } from '../../types';
import {
  FileText, Plane, Home, Car, Shield, Contact,
  Plus, Trash2, Wand2, Sparkles, Loader2, X,
  Check, Activity, RefreshCw, Clock, Camera as CameraIcon,
  Ticket, Navigation, Eye, Lock, ShieldCheck, Mail, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronUp, MapPin
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { geminiService } from '../../src/services/GeminiService';
import { formatDistanceToNow } from 'date-fns';
import { emailOAuthService, type EmailConnection } from '../../src/services/EmailOAuthService';
import { emailScannerService, type EmailScanResult, type ParsedEmail } from '../../src/services/EmailScannerService';
import { useToast } from '../../contexts/ToastContext';
import { useConfirm } from '../../contexts/ConfirmContext';

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
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [importText, setImportText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  // Email import state
  const [showEmailImport, setShowEmailImport] = useState(false);
  const [emailConnections, setEmailConnections] = useState<EmailConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<EmailScanResult | null>(null);
  const [parsedEmails, setParsedEmails] = useState<ParsedEmail[]>([]);
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());

  // Manual import state
  const [showManualImport, setShowManualImport] = useState(false);
  const [manualDocType, setManualDocType] = useState<'Flight' | 'Hotel' | 'Car' | 'Insurance' | 'Contact'>('Flight');
  const [manualDocData, setManualDocData] = useState({
    title: '',
    details: '',
    confirmation: '',
    status: 'Confirmed',
    gate: ''
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isEditor = trip.currentUserRole === 'Editor';

  // Load email connections on mount
  useEffect(() => {
    loadEmailConnections();
  }, []);

  const loadEmailConnections = async () => {
    setIsLoadingConnections(true);
    const result = await emailOAuthService.getConnections();
    if (result.connections) {
      setEmailConnections(result.connections);
    }
    setIsLoadingConnections(false);
  };

  const handleConnectGmail = async () => {
    const result = await emailOAuthService.connectGmail();
    if (!result.success) {
      showToast(`Failed to connect Gmail: ${result.error}`, 'error');
    }
    // OAuth flow will redirect, so no need to reload connections here
  };

  const handleDisconnectGmail = async (connectionId: string) => {
    const confirmed = await confirm({
      title: 'Disconnect Gmail Account',
      message: 'Are you sure you want to disconnect this Gmail account? You can reconnect anytime.',
      type: 'warning',
      confirmText: 'Disconnect',
      cancelText: 'Cancel'
    });

    if (!confirmed) {
      return;
    }

    const result = await emailOAuthService.disconnectGmail(connectionId);
    if (result.success) {
      showToast('Gmail disconnected successfully', 'success');
      // Refresh connections list
      await loadEmailConnections();
    } else {
      showToast(`Failed to disconnect: ${result.error}`, 'error');
    }
  };

  const handleScanEmails = async (connectionId: string) => {
    setIsScanning(true);
    setScanResult(null);

    const result = await emailScannerService.scanEmails(connectionId, {
      maxResults: 50,
      daysBack: 30,
    });

    if (result.success && result.result) {
      setScanResult(result.result);
      showToast(`Scanned ${result.result.total_scanned} emails successfully`, 'success');
      // Load parsed emails for review
      const emailsResult = await emailScannerService.getParsedEmails(connectionId);
      if (emailsResult.success && emailsResult.emails) {
        setParsedEmails(emailsResult.emails);
      }
    } else {
      showToast(`Email scan failed: ${result.error}`, 'error');
    }

    setIsScanning(false);
  };

  const handleRematchEmails = async (connectionId: string) => {
    setIsScanning(true);
    setScanResult(null);

    const result = await emailScannerService.rematchParsedEmails(connectionId);

    if (result.success && result.result) {
      setScanResult({
        total_scanned: result.result.total_emails,
        successful_parses: result.result.newly_matched,
        failed_parses: 0,
        duplicates_found: 0,
        documents_created: result.result.auto_imported,
        errors: result.result.errors || [],
      });
      showToast(
        `Re-matched ${result.result.total_emails} emails: ${result.result.newly_matched} newly matched, ${result.result.auto_imported} auto-imported`,
        'success'
      );
      // Reload parsed emails to show updated match status
      const emailsResult = await emailScannerService.getParsedEmails(connectionId);
      if (emailsResult.success && emailsResult.emails) {
        setParsedEmails(emailsResult.emails);
      }
    } else {
      showToast(`Email re-match failed: ${result.error}`, 'error');
    }

    setIsScanning(false);
  };

  const deleteDoc = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Document',
      message: 'Are you sure you want to permanently delete this document from your vault?',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;
    updateTrip({ ...trip, documents: trip.documents.filter(d => d.id !== id) });
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access denied", err);
      showToast("Please enable camera permissions to use AI Vision Scan.", 'error');
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
      const response = await geminiService.generateWithVision({
        image: { mimeType: 'image/jpeg', data: base64Image },
        prompt: 'Extract travel details: type (Flight/Hotel/Car/Insurance/Contact), title, details, and confirmation code. Return a structured JSON object.',
        schema: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            title: { type: 'string' },
            details: { type: 'string' },
            confirmation: { type: 'string' }
          },
          required: ['type', 'title', 'confirmation']
        }
      });

      const parsed = JSON.parse(response || '{}');
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
      showToast('Document scanned and added successfully', 'success');
      stopCamera();
    } catch (e) {
      console.error("Vision scan failed", e);
      showToast("Intelligence scan failed. Please capture manually or ensure the document is clearly visible.", 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const refreshFlightStatus = async (docId: string) => {
    setUpdatingStatusId(docId);
    try {
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

  const handleManualImport = () => {
    // Validate required fields
    if (!manualDocData.title.trim()) {
      showToast('Please enter a title for the document', 'error');
      return;
    }
    if (!manualDocData.confirmation.trim()) {
      showToast('Please enter a confirmation number', 'error');
      return;
    }

    // Create new document
    const newDoc: TravelDocument = {
      id: uuidv4(),
      type: manualDocType,
      title: manualDocData.title.trim(),
      details: manualDocData.details.trim() || 'Manually added',
      confirmation: manualDocData.confirmation.trim(),
      status: manualDocData.status || 'Confirmed',
      gate: manualDocType === 'Flight' ? manualDocData.gate : undefined,
      lastUpdated: new Date().toISOString()
    };

    // Add to trip documents
    updateTrip({
      ...trip,
      documents: [newDoc, ...trip.documents]
    });

    // Reset form and close modal
    setManualDocData({
      title: '',
      details: '',
      confirmation: '',
      status: 'Confirmed',
      gate: ''
    });
    setShowManualImport(false);
    showToast(`${manualDocType} document added successfully`, 'success');
  };

  const handleSmartImport = async () => {
    if (!importText.trim()) return;
    setIsParsing(true);
    try {
      const response = await geminiService.generateText({
        prompt: `Extract travel booking details from this text: "${importText}". Return a structured JSON object.`,
        model: 'gemini-2.0-flash-exp',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              title: { type: 'string' },
              details: { type: 'string' },
              confirmation: { type: 'string' }
            },
            required: ['type', 'title', 'confirmation']
          }
        }
      });
      const parsed = JSON.parse(response || '{}');
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
      showToast('Document imported successfully', 'success');
      setShowSmartImport(false);
      setImportText('');
    } catch (error) {
      console.error(error);
      showToast("Decoding failed. The text might be incomplete.", 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const toggleCandidates = (emailId: string) => {
    setExpandedCandidates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const getMatchStatusBadge = (matchAction: string | null, matchConfidence: number | null) => {
    if (!matchAction || matchAction === 'unmatched') {
      return (
        <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full font-semibold flex items-center gap-1">
          <AlertTriangle size={12} /> No Match
        </span>
      );
    }

    if (matchAction === 'auto_assigned') {
      return (
        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full font-semibold flex items-center gap-1">
          <CheckCircle2 size={12} /> Auto-Assigned ({matchConfidence}%)
        </span>
      );
    }

    if (matchAction === 'suggested') {
      return (
        <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-full font-semibold flex items-center gap-1">
          <Sparkles size={12} /> Suggested ({matchConfidence}%)
        </span>
      );
    }

    if (matchAction === 'review_needed') {
      return (
        <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full font-semibold flex items-center gap-1">
          <AlertTriangle size={12} /> Review ({matchConfidence}%)
        </span>
      );
    }

    if (matchAction === 'manual') {
      return (
        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full font-semibold flex items-center gap-1">
          <Check size={12} /> Manual Match
        </span>
      );
    }

    return null;
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
              <button
                onClick={() => setShowEmailImport(true)}
                className="bg-white/5 backdrop-blur-xl border border-white/10 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:bg-white/10 transition-all"
              >
                <Mail size={20} /> Email Import
              </button>
              <button
                onClick={() => setShowManualImport(true)}
                className="bg-brand-primary/20 backdrop-blur-xl border border-brand-primary/30 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:bg-brand-primary/30 transition-all"
              >
                <Plus size={20} /> Manual Import
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
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 md:p-10 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white flex-shrink-0">
              <div>
                <h3 className="text-xl md:text-2xl font-display font-bold mb-1">Email Parser</h3>
                <p className="text-slate-400 font-medium text-sm">Extract intel from booking confirmations.</p>
              </div>
              <button onClick={() => setShowSmartImport(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-6 md:p-10 space-y-6 overflow-y-auto flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Confirmation Content</label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste your booking email text here..."
                  className="w-full p-4 md:p-6 bg-slate-50 dark:bg-slate-950 rounded-xl md:rounded-2xl font-medium outline-none h-36 md:h-48 border-2 border-transparent focus:border-brand-primary transition-all dark:text-white text-sm"
                />
              </div>
              <button
                onClick={handleSmartImport}
                disabled={isParsing || !importText.trim()}
                className="w-full py-4 md:py-5 bg-brand-primary text-white font-black text-xs uppercase tracking-widest rounded-xl md:rounded-2xl shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
              >
                {isParsing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {isParsing ? 'Decrypting Intel...' : 'Infiltrate Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Import Modal */}
      {showManualImport && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 md:p-10 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white flex-shrink-0">
              <div>
                <h3 className="text-xl md:text-2xl font-display font-bold mb-1">Manual Import</h3>
                <p className="text-slate-400 font-medium text-sm">Add travel documents directly.</p>
              </div>
              <button onClick={() => setShowManualImport(false)} className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-6 md:p-10 space-y-6 overflow-y-auto flex-1">
              {/* Document Type Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Document Type</label>
                <div className="grid grid-cols-5 gap-3">
                  {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map((type) => {
                    const config = TYPE_CONFIG[type];
                    const isSelected = manualDocType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setManualDocType(type)}
                        className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          isSelected
                            ? 'border-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20'
                            : 'border-slate-200 dark:border-white/10 hover:border-brand-primary/50'
                        }`}
                      >
                        <div className={`${config.color} p-2 rounded-xl text-white`}>
                          {config.icon}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider dark:text-white">{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Title *</label>
                <input
                  type="text"
                  value={manualDocData.title}
                  onChange={(e) => setManualDocData({ ...manualDocData, title: e.target.value })}
                  placeholder="e.g. United Airlines Flight, Marriott Hotel"
                  className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-950 rounded-xl md:rounded-2xl font-medium outline-none border-2 border-transparent focus:border-brand-primary transition-all dark:text-white text-sm"
                />
              </div>

              {/* Details Textarea */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Details</label>
                <textarea
                  value={manualDocData.details}
                  onChange={(e) => setManualDocData({ ...manualDocData, details: e.target.value })}
                  placeholder="e.g. SFO to NYC, Room 502, etc."
                  className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-950 rounded-xl md:rounded-2xl font-medium outline-none h-24 border-2 border-transparent focus:border-brand-primary transition-all dark:text-white text-sm"
                />
              </div>

              {/* Confirmation Number */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Confirmation Number *</label>
                <input
                  type="text"
                  value={manualDocData.confirmation}
                  onChange={(e) => setManualDocData({ ...manualDocData, confirmation: e.target.value.toUpperCase() })}
                  placeholder="e.g. ABC123"
                  className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-950 rounded-xl md:rounded-2xl font-mono font-bold outline-none border-2 border-transparent focus:border-brand-primary transition-all dark:text-white text-sm uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Status Selector */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Status</label>
                  <select
                    value={manualDocData.status}
                    onChange={(e) => setManualDocData({ ...manualDocData, status: e.target.value })}
                    className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-950 rounded-xl md:rounded-2xl font-medium outline-none border-2 border-transparent focus:border-brand-primary transition-all dark:text-white text-sm"
                  >
                    <option value="Confirmed">Confirmed</option>
                    <option value="On Time">On Time</option>
                    <option value="Delayed">Delayed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Gate Input (only for flights) */}
                {manualDocType === 'Flight' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Gate (Optional)</label>
                    <input
                      type="text"
                      value={manualDocData.gate}
                      onChange={(e) => setManualDocData({ ...manualDocData, gate: e.target.value.toUpperCase() })}
                      placeholder="e.g. 12A"
                      className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-950 rounded-xl md:rounded-2xl font-mono font-bold outline-none border-2 border-transparent focus:border-brand-primary transition-all dark:text-white text-sm uppercase"
                    />
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={handleManualImport}
                disabled={!manualDocData.title.trim() || !manualDocData.confirmation.trim()}
                className="w-full py-4 md:py-5 bg-brand-primary text-white font-black text-xs uppercase tracking-widest rounded-xl md:rounded-2xl shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Plus size={18} />
                Add {manualDocType} Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Import Modal */}
      {showEmailImport && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2rem] md:rounded-[3rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 md:p-10 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 text-slate-900 dark:text-white flex-shrink-0">
              <div>
                <h3 className="text-xl md:text-2xl font-display font-bold mb-1">Email Import</h3>
                <p className="text-slate-400 font-medium text-sm">Automatically scan and import booking confirmations from Gmail.</p>
              </div>
              <button
                onClick={() => setShowEmailImport(false)}
                className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl transition-all text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-10 space-y-6 overflow-y-auto flex-1">
              {/* Email Connections Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Email Connections</h4>
                  {emailConnections.length > 0 && (
                    <button
                      onClick={handleConnectGmail}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold text-xs hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <Plus size={14} /> Add Account
                    </button>
                  )}
                </div>

                {isLoadingConnections ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-brand-primary" size={32} />
                  </div>
                ) : emailConnections.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-8 text-center">
                    <Mail size={48} className="mx-auto mb-4 text-slate-300" />
                    <h5 className="font-bold text-lg mb-2">No Email Connected</h5>
                    <p className="text-slate-500 mb-6">Connect your Gmail account to scan for booking confirmations.</p>
                    <button
                      onClick={handleConnectGmail}
                      className="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
                    >
                      <Mail size={16} className="inline mr-2" /> Connect Gmail
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {emailConnections.map((connection) => (
                      <div
                        key={connection.id}
                        className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 flex items-center justify-between border border-slate-200 dark:border-white/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center text-white">
                            <Mail size={24} />
                          </div>
                          <div>
                            <p className="font-bold">{connection.email_address}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  connection.connection_status === 'active'
                                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                    : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                }`}
                              >
                                {connection.connection_status}
                              </span>
                              {connection.last_sync_at && (
                                <span className="text-xs text-slate-400">
                                  Last scan: {formatDistanceToNow(new Date(connection.last_sync_at))} ago
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleScanEmails(connection.id)}
                            disabled={isScanning || connection.connection_status !== 'active'}
                            className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isScanning ? (
                              <>
                                <Loader2 className="animate-spin" size={14} /> Scanning...
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} /> Scan Emails
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleRematchEmails(connection.id)}
                            disabled={isScanning || connection.connection_status !== 'active'}
                            className="px-4 py-3 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            title="Re-run matching logic on existing parsed emails"
                          >
                            {isScanning ? (
                              <>
                                <Loader2 className="animate-spin" size={14} /> Re-matching...
                              </>
                            ) : (
                              <>
                                <RefreshCw size={14} /> Re-match All
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDisconnectGmail(connection.id)}
                            className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                            title="Disconnect Gmail"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scan Results Section */}
              {scanResult && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Scan Results</h4>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{scanResult.total_scanned}</p>
                        <p className="text-xs text-slate-500">Emails Scanned</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{scanResult.successful_parses}</p>
                        <p className="text-xs text-slate-500">Successfully Parsed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{scanResult.documents_created}</p>
                        <p className="text-xs text-slate-500">Auto-Imported</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{scanResult.duplicates_found}</p>
                        <p className="text-xs text-slate-500">Duplicates</p>
                      </div>
                    </div>
                    {scanResult.errors.length > 0 && (
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/30">
                        <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-2">Errors ({scanResult.errors.length}):</p>
                        <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                          {scanResult.errors.slice(0, 3).map((error, i) => (
                            <li key={i}>• {error}</li>
                          ))}
                          {scanResult.errors.length > 3 && (
                            <li className="font-semibold">...and {scanResult.errors.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Parsed Emails for Review */}
              {parsedEmails.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                    Scanned Emails ({parsedEmails.filter((e) => e.user_action === 'pending').length} pending)
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {parsedEmails
                      .filter((email) => email.user_action === 'pending')
                      .slice(0, 10)
                      .map((email) => {
                        const isExpanded = expandedCandidates.has(email.id);
                        const hasCandidates = email.match_candidates && Array.isArray(email.match_candidates) && email.match_candidates.length > 0;

                        return (
                          <div
                            key={email.id}
                            className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-white/5 hover:border-brand-primary dark:hover:border-brand-primary transition-colors"
                          >
                            {/* Main Content */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
                                    {email.detected_type}
                                  </span>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      email.confidence >= 0.8
                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                        : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                                    }`}
                                  >
                                    Parse: {Math.round(email.confidence * 100)}%
                                  </span>
                                  {getMatchStatusBadge(email.match_action, email.match_confidence ? Math.round(email.match_confidence) : null)}
                                </div>
                                <p className="font-bold text-sm mb-1">{email.summary}</p>
                                <p className="text-xs text-slate-500">From: {email.email_from}</p>

                                {/* Trip Assignment Display */}
                                {email.trip_id && (
                                  <div className="mt-2 flex items-center gap-2 text-xs bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary px-3 py-1.5 rounded-lg">
                                    <MapPin size={12} />
                                    <span className="font-semibold">Assigned to trip</span>
                                  </div>
                                )}
                              </div>
                              <CheckCircle2
                                size={20}
                                className="text-green-500 cursor-pointer hover:scale-110 transition-transform flex-shrink-0 ml-2"
                                title="Import to documents"
                              />
                            </div>

                            {/* Match Candidates Section */}
                            {hasCandidates && (
                              <div className="border-t border-slate-200 dark:border-white/5 pt-3 mt-3">
                                <button
                                  onClick={() => toggleCandidates(email.id)}
                                  className="flex items-center gap-2 text-xs font-semibold text-brand-primary hover:text-brand-secondary transition-colors w-full"
                                >
                                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  {email.match_candidates.length} Possible Trip Match{email.match_candidates.length !== 1 ? 'es' : ''}
                                </button>

                                {isExpanded && (
                                  <div className="mt-3 space-y-2">
                                    {email.match_candidates.map((candidate: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-xs"
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-bold text-slate-900 dark:text-white">
                                            Trip Match #{idx + 1}
                                          </span>
                                          <span className={`px-2 py-0.5 rounded-full font-semibold ${
                                            candidate.confidence >= 85
                                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                              : candidate.confidence >= 70
                                              ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                                              : 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                                          }`}>
                                            {Math.round(candidate.confidence)}%
                                          </span>
                                        </div>
                                        {candidate.reasons && candidate.reasons.length > 0 && (
                                          <ul className="text-slate-600 dark:text-slate-400 space-y-0.5 ml-2">
                                            {candidate.reasons.map((reason: string, rIdx: number) => (
                                              <li key={rIdx} className="text-[10px]">• {reason}</li>
                                            ))}
                                          </ul>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;
