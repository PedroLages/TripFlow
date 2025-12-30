
import React, { useState, useRef } from 'react';
import { Trip, Expense } from '../../types';
import { 
  DollarSign, PieChart as ChartIcon, Plus, Trash2, 
  Calendar, TrendingUp, RefreshCw, ArrowRightLeft,
  Camera, Zap, Loader2, X, Check, AlertCircle,
  TrendingDown, Info, Receipt, Wallet
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, differenceInDays } from 'date-fns';
import { GoogleGenAI, Type } from "@google/genai";

interface BudgetTabProps {
  trip: Trip;
  updateTrip: (trip: Trip) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Flights': '#6366f1',
  'Accommodation': '#14b8a6',
  'Food': '#f59e0b',
  'Activities': '#8b5cf6',
  'Transport': '#64748b',
  'Shopping': '#ec4899',
  'Other': '#94a3b8'
};

const BudgetTab: React.FC<BudgetTabProps> = ({ trip, updateTrip }) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [convAmount, setConvAmount] = useState<string>('1');
  const [fromCurr, setFromCurr] = useState('USD');
  const [toCurr, setToCurr] = useState('EUR');
  const [rates] = useState<Record<string, number>>({ 'EUR': 0.92, 'GBP': 0.79, 'JPY': 151.2, 'USD': 1 });

  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    amount: 0,
    category: 'Food',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  // Calculations
  const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = Math.max(0, trip.budget - totalSpent);
  const tripDuration = Math.max(1, differenceInDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1);
  const dailyAllocated = trip.budget / tripDuration;
  const currentDailyAvg = totalSpent / tripDuration;
  const projectedTotal = currentDailyAvg * tripDuration;
  const spentPercent = trip.budget > 0 ? Math.min(100, Math.round((totalSpent / trip.budget) * 100)) : 0;

  const expensesByCategory = Object.keys(CATEGORY_COLORS).map(cat => ({
    name: cat,
    value: trip.expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(cat => cat.value > 0);

  // Grouping expenses by date
  const groupedExpenses = trip.expenses.reduce((groups: Record<string, Expense[]>, expense) => {
    const date = expense.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(expense);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a));

  const handleAddExpense = () => {
    if (!newExpense.amount) return;
    const expense: Expense = {
      ...newExpense as Expense,
      id: uuidv4(),
      date: newExpense.date || format(new Date(), 'yyyy-MM-dd')
    };
    updateTrip({ ...trip, expenses: [expense, ...trip.expenses] });
    setNewExpense({ amount: 0, category: 'Food', date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
    setShowAddExpense(false);
  };

  const deleteExpense = (id: string) => {
    updateTrip({ ...trip, expenses: trip.expenses.filter(e => e.id !== id) });
  };

  const startScanner = async () => {
    setShowScanner(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Please enable camera permissions to scan receipts.");
      setShowScanner(false);
    }
  };

  const stopScanner = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
    setShowScanner(false);
  };

  const captureAndParse = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsScanning(true);
    const context = canvasRef.current.getContext('2d');
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context?.drawImage(videoRef.current, 0, 0);
    const base64Image = canvasRef.current.toDataURL('image/jpeg').split(',')[1];

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: "Extract total amount (number), category (Flights/Accommodation/Food/Activities/Transport/Shopping/Other), and a short note (vendor name) from this receipt. Return as JSON." }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER },
              category: { type: Type.STRING },
              notes: { type: Type.STRING }
            },
            required: ['amount', 'category', 'notes']
          }
        }
      });
      const data = JSON.parse(response.text || '{}');
      setNewExpense({ 
        amount: data.amount || 0,
        category: (data.category && Object.keys(CATEGORY_COLORS).includes(data.category)) ? data.category : 'Other',
        notes: data.notes || 'Scanned Receipt',
        date: format(new Date(), 'yyyy-MM-dd') 
      });
      stopScanner();
      setShowAddExpense(true);
    } catch (e) {
      console.error("Scan failed", e);
      alert("AI Intelligence failed to read receipt. Manual entry required.");
      stopScanner();
    } finally {
      setIsScanning(false);
    }
  };

  const convertedValue = (Number(convAmount) * (rates[toCurr] / rates[fromCurr])).toFixed(2);

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-12 pb-32 no-scrollbar">
      {/* Financial Command Center */}
      <section className="bg-slate-950 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-12">
          <div className="space-y-6 max-w-xl">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-brand-primary rounded-2xl shadow-lg shadow-indigo-500/20">
                 <Wallet size={24} />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Financial Intelligence</span>
             </div>
             <h2 className="text-5xl md:text-6xl font-display font-bold">Expenditure <span className="text-brand-primary">Ops</span></h2>
             <p className="text-white/50 text-lg font-medium">Monitoring capital deployment across {tripDuration} phases. AI-enhanced tracking for mission critical spend.</p>
             <div className="flex flex-wrap gap-4 pt-4">
                <button 
                  onClick={startScanner}
                  className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-slate-100 transition-all shadow-xl"
                >
                  <Camera size={18} className="text-brand-primary" /> Scan Receipt
                </button>
                <button 
                  onClick={() => setShowAddExpense(true)}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all"
                >
                  <Plus size={18} /> Manual Entry
                </button>
             </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="grid grid-cols-2 gap-4 w-full lg:w-96">
             <div className="bg-white/5 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-2">Daily Burn Rate</p>
                <p className="text-3xl font-display font-bold">${currentDailyAvg.toFixed(0)}</p>
                <div className="flex items-center gap-1 mt-2">
                   {currentDailyAvg > dailyAllocated ? <TrendingUp size={12} className="text-red-400" /> : <TrendingDown size={12} className="text-emerald-400" />}
                   <span className={`text-[10px] font-bold ${currentDailyAvg > dailyAllocated ? 'text-red-400' : 'text-emerald-400'}`}>
                    {((currentDailyAvg / dailyAllocated) * 100).toFixed(0)}% of limit
                   </span>
                </div>
             </div>
             <div className="bg-white/5 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10">
                <p className="text-[9px] font-black uppercase tracking-widest text-brand-primary mb-2">Projected Landing</p>
                <p className="text-3xl font-display font-bold">${projectedTotal.toFixed(0)}</p>
                <p className="text-[10px] text-white/30 font-bold uppercase mt-2">Vs ${trip.budget} Goal</p>
             </div>
          </div>
        </div>
      </section>

      {/* Analytics Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Spending Doughnut */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-100 dark:border-white/5 shadow-sm flex flex-col md:flex-row gap-10">
           <div className="flex-1 space-y-6">
              <h3 className="text-xl font-display font-bold flex items-center gap-3">
                <ChartIcon className="text-brand-primary" size={20} /> Allocation Matrix
              </h3>
              <div className="space-y-4">
                {expensesByCategory.map(cat => (
                  <div key={cat.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.name] }} />
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{cat.name}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white">${cat.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
           </div>
           <div className="w-full md:w-64 h-64 relative">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={75}
                    outerRadius={100}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  />
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Spent</p>
                <p className="text-2xl font-display font-bold">${totalSpent.toLocaleString()}</p>
             </div>
           </div>
        </div>

        {/* Tactical Currency Tool */}
        <div className="bg-brand-secondary rounded-[3.5rem] p-10 text-white shadow-2xl flex flex-col justify-between">
           <div>
              <div className="flex justify-between items-center mb-8">
                <div className="p-3 bg-white/10 rounded-2xl"><RefreshCw size={20} className="animate-spin-slow" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Live Exchange</span>
              </div>
              <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <input 
                      type="number"
                      value={convAmount}
                      onChange={(e) => setConvAmount(e.target.value)}
                      className="bg-white/10 w-full p-4 rounded-2xl text-2xl font-display font-bold outline-none border border-white/10 focus:border-brand-primary"
                    />
                    <select value={fromCurr} onChange={(e) => setFromCurr(e.target.value)} className="bg-transparent font-black text-lg outline-none">
                      {Object.keys(rates).map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                    </select>
                 </div>
                 <div className="flex justify-center py-2"><ArrowRightLeft size={24} className="opacity-20" /></div>
                 <div className="flex items-center gap-4">
                    <div className="w-full p-4 bg-white/5 rounded-2xl text-2xl font-display font-bold border border-white/5">{convertedValue}</div>
                    <select value={toCurr} onChange={(e) => setToCurr(e.target.value)} className="bg-transparent font-black text-lg outline-none">
                      {Object.keys(rates).map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                    </select>
                 </div>
              </div>
           </div>
           <p className="text-[9px] font-bold text-white/30 italic mt-8 text-center">Baseline: Standard Institutional Rates</p>
        </div>
      </section>

      {/* Grouped Ledger */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
          <h3 className="text-2xl font-display font-bold flex items-center gap-3">
             <Receipt className="text-brand-primary" size={24} /> Mission Ledger
          </h3>
          <div className="flex gap-4">
             <div className="bg-white dark:bg-slate-900 px-6 py-2.5 rounded-full border border-slate-100 dark:border-white/5 text-xs font-bold text-slate-400">
               Remaining: <span className="text-brand-primary">${remainingBudget.toLocaleString()}</span>
             </div>
          </div>
        </div>

        <div className="space-y-12">
          {sortedDates.map(date => (
            <div key={date} className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">{format(parseISO(date), 'MMM dd, yyyy')}</span>
                 <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedExpenses[date].map(exp => (
                  <div key={exp.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:shadow-xl transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: CATEGORY_COLORS[exp.category] }}>
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{exp.notes || exp.category}</h4>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{exp.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xl font-display font-bold text-slate-900 dark:text-white">${exp.amount}</p>
                        {exp.amount > currentDailyAvg * 1.5 && (
                          <span className="text-[8px] font-black bg-red-50 text-red-500 px-2 py-0.5 rounded-lg uppercase tracking-widest">Outlier</span>
                        )}
                      </div>
                      <button 
                        onClick={() => deleteExpense(exp.id)}
                        className="p-3 text-slate-200 hover:text-red-500 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {trip.expenses.length === 0 && (
            <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-white/5">
               <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                 <AlertCircle size={48} />
               </div>
               <h4 className="text-2xl font-display font-bold">No Expenditure Detected</h4>
               <p className="text-slate-400 mt-2">Begin deploying capital to see the mission matrix.</p>
            </div>
          )}
        </div>
      </section>

      {/* Receipt Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl">
           <div className="relative w-full max-w-2xl aspect-[3/4] bg-black rounded-[4rem] overflow-hidden border-4 border-white/10 shadow-3xl">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              
              {isScanning && (
                 <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-10 text-center">
                    <Loader2 className="animate-spin mb-6 text-brand-primary" size={64} />
                    <h3 className="text-3xl font-display font-bold mb-4">AI Vision Active</h3>
                    <p className="text-white/50 text-lg">Parsing receipt data points & calculating trajectory...</p>
                 </div>
              )}

              <div className="absolute inset-x-0 top-10 flex justify-center">
                 <div className="px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Position Receipt in Frame</span>
                 </div>
              </div>

              <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-8">
                <button onClick={stopScanner} className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"><X /></button>
                <button onClick={captureAndParse} className="w-24 h-24 rounded-[2.5rem] bg-white border-8 border-brand-primary shadow-3xl flex items-center justify-center text-brand-primary hover:scale-105 active:scale-95 transition-all"><Camera size={36}/></button>
              </div>
           </div>
        </div>
      )}

      {/* Manual Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[4rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-12 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div>
                <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-white">New Expense</h3>
                <p className="text-slate-400 font-medium">Capture capital deployment data.</p>
              </div>
              <button onClick={() => setShowAddExpense(false)} className="p-4 hover:bg-white dark:hover:bg-slate-800 rounded-3xl transition-all text-slate-400"><X size={24} /></button>
            </div>
            
            <div className="p-12 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Amount</label>
                <div className="relative">
                   <div className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-primary font-display font-bold text-2xl">$</div>
                   <input 
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                    className="w-full p-6 pl-12 bg-slate-50 dark:bg-slate-950 rounded-3xl font-display font-bold text-3xl outline-none border-2 border-transparent focus:border-brand-primary transition-all dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sector</label>
                  <select 
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                    className="w-full p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-brand-primary dark:text-white"
                  >
                    {Object.keys(CATEGORY_COLORS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date</label>
                  <input 
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-brand-primary dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Intelligence Note</label>
                <input 
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-brand-primary dark:text-white"
                  placeholder="e.g., Starbucks Shinjuku"
                />
              </div>

              <button 
                onClick={handleAddExpense}
                className="w-full py-6 bg-brand-primary text-white font-black text-xs uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-indigo-500/30 hover:bg-brand-secondary transition-all active:scale-95"
              >
                Seal Ledger Entry
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default BudgetTab;
