
import React, { useState, useRef, useMemo } from 'react';
import { Trip, Expense } from '../../types';
import {
  DollarSign, PieChart as ChartIcon, Plus, Trash2,
  Calendar, TrendingUp, RefreshCw, ArrowRightLeft,
  Camera, Zap, Loader2, X, Check, AlertCircle,
  TrendingDown, Info, Receipt, Wallet, Users, Filter, Globe, Download,
  Brain, Sparkles
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO, differenceInDays } from 'date-fns';
import { geminiService } from '../../src/services/GeminiService';
import { calculateUserBalances } from '../../utils/expenseSplitCalculations';
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '../../utils/currencyHelpers';
import SplitIndicator from '../expense/SplitIndicator';
import UserBalanceCard from '../expense/UserBalanceCard';
import SplitExpenseModal from '../modals/SplitExpenseModal';
import ExportModal from '../modals/ExportModal';
import DeleteConfirmationModal from '../modals/DeleteConfirmationModal';
import { ConvertedAmount } from '../ConvertedAmount';
import { useBatchCurrencyConversion } from '../../hooks/useCurrencyConversion';
import { useTerminology } from '../../hooks/TerminologyContext';
import { useToast } from '../../contexts/ToastContext';

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

type ExpenseFilter = 'all' | 'split' | 'personal';

const BudgetTab: React.FC<BudgetTabProps> = ({ trip, updateTrip }) => {
  const t = useTerminology();
  const { showToast } = useToast();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [expenseFilter, setExpenseFilter] = useState<ExpenseFilter>('all');
  const [showInPreferredCurrency, setShowInPreferredCurrency] = useState(false);
  const [preferredCurrency, setPreferredCurrency] = useState<string>('USD');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
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
    notes: '',
    currency: 'USD'
  });

  // AI Budget Insights
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // ESC key handler for modals
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddExpense) setShowAddExpense(false);
        if (showScanner) stopScanner();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAddExpense, showScanner]);

  // Filter expenses based on selection
  const filteredExpenses = useMemo(() => {
    if (expenseFilter === 'split') {
      return trip.expenses.filter(exp => exp.isSplit);
    } else if (expenseFilter === 'personal') {
      return trip.expenses.filter(exp => !exp.isSplit);
    }
    return trip.expenses;
  }, [trip.expenses, expenseFilter]);

  // Count expenses by filter type
  const expenseCounts = useMemo(() => ({
    all: trip.expenses.length,
    split: trip.expenses.filter(exp => exp.isSplit).length,
    personal: trip.expenses.filter(exp => !exp.isSplit).length,
  }), [trip.expenses]);

  // Calculations
  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remainingBudget = Math.max(0, trip.budget - totalSpent);
  const tripDuration = Math.max(1, differenceInDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1);
  const dailyAllocated = trip.budget / tripDuration;
  const currentDailyAvg = totalSpent / tripDuration;
  const projectedTotal = currentDailyAvg * tripDuration;
  const spentPercent = trip.budget > 0 ? Math.min(100, Math.round((totalSpent / trip.budget) * 100)) : 0;

  const expensesByCategory = Object.keys(CATEGORY_COLORS).map(cat => ({
    name: cat,
    value: filteredExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0)
  })).filter(cat => cat.value > 0);

  // Calculate user balances for split expenses
  const userBalances = useMemo(() => {
    return calculateUserBalances(trip.expenses, trip.collaborators, trip.ownerEmail);
  }, [trip.expenses, trip.collaborators, trip.ownerEmail]);

  // Get current user's balance (demo user for now)
  const currentUserEmail = 'demo@tripflow.ai';
  const currentUserBalance = userBalances.get(currentUserEmail);

  // Multi-currency conversion for expenses
  const expenseConversions = useMemo(() => {
    return filteredExpenses.map(exp => ({
      amount: exp.amount,
      currency: exp.currency || 'USD',
    }));
  }, [filteredExpenses]);

  const { results: convertedExpenses, totalConverted, isLoading: isConverting } =
    useBatchCurrencyConversion(
      expenseConversions,
      showInPreferredCurrency ? preferredCurrency : 'USD'
    );

  // Use converted total if showing in preferred currency, otherwise use original
  const displayTotal = showInPreferredCurrency ? totalConverted : totalSpent;

  // Grouping expenses by date (using filtered expenses)
  const groupedExpenses = filteredExpenses.reduce((groups: Record<string, Expense[]>, expense) => {
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
      date: newExpense.date || format(new Date(), 'yyyy-MM-dd'),
      currency: newExpense.currency || 'USD'
    };
    updateTrip({ ...trip, expenses: [expense, ...trip.expenses] });
    setNewExpense({ amount: 0, category: 'Food', date: format(new Date(), 'yyyy-MM-dd'), notes: '', currency: 'USD' });
    setShowAddExpense(false);
  };

  const handleAddSplitExpense = (expense: Expense) => {
    updateTrip({ ...trip, expenses: [expense, ...trip.expenses] });
  };

  const requestDeleteExpense = (id: string) => {
    setExpenseToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteExpense = () => {
    if (expenseToDelete) {
      updateTrip({ ...trip, expenses: trip.expenses.filter(e => e.id !== expenseToDelete) });
    }
    setShowDeleteModal(false);
    setExpenseToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setExpenseToDelete(null);
  };

  const startScanner = async () => {
    setShowScanner(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera access denied", err);
      showToast("Please enable camera permissions to scan receipts.", 'error');
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
      const response = await geminiService.generateWithVision({
        image: { mimeType: 'image/jpeg', data: base64Image },
        prompt: 'Extract total amount (number), category (Flights/Accommodation/Food/Activities/Transport/Shopping/Other), and a short note (vendor name) from this receipt. Return as JSON.',
        schema: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            category: { type: 'string' },
            notes: { type: 'string' }
          },
          required: ['amount', 'category', 'notes']
        }
      });
      const data = JSON.parse(response || '{}');
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
      showToast("AI Intelligence failed to read receipt. Manual entry required.", 'error');
      stopScanner();
    } finally {
      setIsScanning(false);
    }
  };

  const convertedValue = (Number(convAmount) * (rates[toCurr] / rates[fromCurr])).toFixed(2);

  // Generate AI-powered budget insights
  const generateBudgetInsights = async () => {
    if (trip.expenses.length === 0) {
      setAiInsights("No expenses yet. Start tracking your spending to get AI-powered insights!");
      return;
    }

    setIsGeneratingInsights(true);
    try {
      const categoryBreakdown = expensesByCategory.map(c =>
        `${c.name}: $${c.value.toFixed(2)} (${((c.value/totalSpent)*100).toFixed(1)}%)`
      ).join(', ');

      const prompt = `Analyze this trip budget and provide 3 concise, actionable insights:
- Budget: $${trip.budget}
- Spent: $${totalSpent.toFixed(2)} (${spentPercent}%)
- Daily avg: $${currentDailyAvg.toFixed(2)} (allocated: $${dailyAllocated.toFixed(2)})
- Categories: ${categoryBreakdown}
- Trip: ${trip.type} to ${trip.destinations.join(', ')} (${tripDuration} days)

Focus on: spending patterns, overspending categories, and smart recommendations. Keep it under 100 words, use bullet points.`;

      const insights = await geminiService.generateText({
        prompt,
        model: 'gemini-2.0-flash-exp'
      });

      setAiInsights(insights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setAiInsights("Unable to generate insights. Please try again later.");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

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
                  aria-label="Scan receipt with camera"
                  className="bg-white text-slate-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-slate-100 transition-all shadow-xl"
                >
                  <Camera size={18} className="text-brand-primary" aria-hidden="true" /> Scan Receipt
                </button>
                <button
                  onClick={() => setShowSplitModal(true)}
                  aria-label="Create split expense"
                  className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-brand-secondary transition-all shadow-xl shadow-indigo-500/20"
                >
                  <Users size={18} aria-hidden="true" /> Split Expense
                </button>
                <button
                  onClick={() => setShowAddExpense(true)}
                  aria-label="Add expense manually"
                  className="bg-white/5 backdrop-blur-xl border border-white/10 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all"
                >
                  <Plus size={18} aria-hidden="true" /> Manual Entry
                </button>
                <button
                  onClick={() => setShowExportModal(true)}
                  aria-label="Export trip data"
                  className="bg-white/5 backdrop-blur-xl border border-white/10 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all"
                >
                  <Download size={18} aria-hidden="true" /> Export
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

      {/* AI Budget Intelligence */}
      <section className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-indigo-950 rounded-[4rem] p-10 border border-indigo-200 dark:border-indigo-500/20 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-primary rounded-2xl shadow-lg shadow-indigo-500/30">
              <Brain size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">AI Strategic Analysis</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Advanced insights from your spending patterns</p>
            </div>
          </div>
          <button
            onClick={generateBudgetInsights}
            disabled={isGeneratingInsights || trip.expenses.length === 0}
            className="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-brand-secondary transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingInsights ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={18} aria-hidden="true" />
                Generate Insights
              </>
            )}
          </button>
        </div>

        {aiInsights && (
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] p-8 border border-indigo-100 dark:border-white/10 shadow-lg">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                {aiInsights}
              </div>
            </div>
          </div>
        )}

        {!aiInsights && !isGeneratingInsights && (
          <div className="bg-white/50 dark:bg-slate-950/50 rounded-[2.5rem] p-8 border border-dashed border-indigo-300 dark:border-indigo-700/30 text-center">
            <Sparkles size={32} className="mx-auto mb-4 text-indigo-400" />
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              {trip.expenses.length === 0
                ? "Add expenses to unlock AI-powered budget analysis"
                : "Click 'Generate Insights' to analyze your spending patterns and get smart recommendations"}
            </p>
          </div>
        )}
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
             {/* Center labels moved before chart and explicitly given lower z-index to avoid overlapping tooltips */}
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Total Spent {showInPreferredCurrency && `(${preferredCurrency})`}
                </p>
                <p className="text-2xl font-display font-bold">
                  {getCurrencySymbol(showInPreferredCurrency ? preferredCurrency : 'USD')}
                  {displayTotal.toLocaleString()}
                </p>
                {showInPreferredCurrency && isConverting && (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-primary mt-1" />
                )}
             </div>
             <ResponsiveContainer width="100%" height="100%" className="z-10 relative">
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
                    wrapperStyle={{ zIndex: 1000 }}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                  />
                </PieChart>
             </ResponsiveContainer>
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

      {/* User Balance Card */}
      {currentUserBalance && (
        <section className="px-4">
          <UserBalanceCard
            balance={currentUserBalance}
            currency="USD"
            userName="You"
            className="max-w-md"
          />
        </section>
      )}

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

        {/* Expense Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 px-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <Filter size={14} />
            <span>Filter:</span>
          </div>
          <button
            onClick={() => setExpenseFilter('all')}
            aria-label="Show all expenses"
            aria-pressed={expenseFilter === 'all'}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
              expenseFilter === 'all'
                ? 'bg-brand-primary text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-white/5 hover:border-brand-primary/30'
            }`}
          >
            All ({expenseCounts.all})
          </button>
          <button
            onClick={() => setExpenseFilter('split')}
            aria-label="Show only split expenses"
            aria-pressed={expenseFilter === 'split'}
            className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
              expenseFilter === 'split'
                ? 'bg-brand-primary text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-white/5 hover:border-brand-primary/30'
            }`}
          >
            <Users size={14} aria-hidden="true" />
            Split ({expenseCounts.split})
          </button>
          <button
            onClick={() => setExpenseFilter('personal')}
            aria-label="Show only personal expenses"
            aria-pressed={expenseFilter === 'personal'}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
              expenseFilter === 'personal'
                ? 'bg-brand-primary text-white shadow-lg shadow-indigo-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-white/5 hover:border-brand-primary/30'
            }`}
          >
            Personal ({expenseCounts.personal})
          </button>

          {/* Currency Display Separator */}
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

          {/* Currency Display Toggle */}
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-slate-400" />
            <button
              onClick={() => setShowInPreferredCurrency(!showInPreferredCurrency)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                showInPreferredCurrency
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-white/5 hover:border-green-500/30'
              }`}
              aria-label={showInPreferredCurrency ? 'Showing in preferred currency' : 'Showing in original currency'}
            >
              {showInPreferredCurrency ? `Show in ${preferredCurrency}` : 'Original Currency'}
            </button>
            {showInPreferredCurrency && (
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="px-3 py-2 rounded-full text-xs font-bold bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-white/5 outline-none focus:border-brand-primary transition-all"
                aria-label="Select preferred currency"
              >
                {SUPPORTED_CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code}
                  </option>
                ))}
              </select>
            )}
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
                  <div key={exp.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-white/5 group hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-5 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[exp.category] }}>
                          <DollarSign size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 dark:text-white leading-tight truncate">{exp.notes || exp.category}</h4>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{exp.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <ConvertedAmount
                            amount={exp.amount}
                            currency={exp.currency || 'USD'}
                            displayCurrency={showInPreferredCurrency ? preferredCurrency : undefined}
                            showOriginal={showInPreferredCurrency}
                            className="text-xl font-display font-bold text-slate-900 dark:text-white"
                            compact={false}
                          />
                          {exp.amount > currentDailyAvg * 1.5 && (
                            <span className="text-[8px] font-black bg-red-50 text-red-500 px-2 py-0.5 rounded-lg uppercase tracking-widest mt-1 inline-block">Outlier</span>
                          )}
                        </div>
                        <button
                          onClick={() => requestDeleteExpense(exp.id)}
                          aria-label={`Delete ${exp.notes || exp.category} expense`}
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-200 hover:text-red-500 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {/* Split Indicator */}
                    {exp.isSplit && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                        <SplitIndicator
                          expense={exp}
                          collaborators={trip.collaborators}
                          ownerEmail={trip.ownerEmail}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredExpenses.length === 0 && (
            <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-white/5">
               <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                 <AlertCircle size={48} />
               </div>
               <h4 className="text-2xl font-display font-bold">
                 {expenseFilter === 'all' ? 'No Expenditure Detected' :
                  expenseFilter === 'split' ? 'No Split Expenses' :
                  'No Personal Expenses'}
               </h4>
               <p className="text-slate-400 mt-2">
                 {expenseFilter === 'all' ? 'Begin deploying capital to see the mission matrix.' :
                  expenseFilter === 'split' ? 'Split expenses will appear here when created.' :
                  'Personal expenses will appear here when created.'}
               </p>
            </div>
          )}
        </div>
      </section>

      {/* Receipt Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-4 bg-slate-950/95 backdrop-blur-3xl" role="dialog" aria-modal="true" aria-label="Receipt scanner">
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
                <button onClick={stopScanner} aria-label="Close scanner" className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"><X aria-hidden="true" /></button>
                <button onClick={captureAndParse} aria-label="Capture receipt" className="w-24 h-24 rounded-[2.5rem] bg-white border-8 border-brand-primary shadow-3xl flex items-center justify-center text-brand-primary hover:scale-105 active:scale-95 transition-all"><Camera size={36} aria-hidden="true" /></button>
              </div>
           </div>
        </div>
      )}

      {/* Manual Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-3xl" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] sm:rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col border border-white/5">
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 flex-shrink-0">
              <div>
                <h3 id="expense-modal-title" className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">New Expense</h3>
                <p className="text-slate-400 font-medium text-sm">Capture capital deployment data.</p>
              </div>
              <button onClick={() => setShowAddExpense(false)} aria-label="Close expense modal" className="w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all text-slate-400 flex-shrink-0"><X size={20} aria-hidden="true" /></button>
            </div>

            <div className="p-6 sm:p-8 space-y-8 overflow-y-auto flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Amount</label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 relative">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary font-display font-bold text-xl">
                       {getCurrencySymbol(newExpense.currency || 'USD')}
                     </div>
                     <input
                      type="number"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                      className="w-full px-4 py-3 pl-10 bg-slate-50 dark:bg-slate-950 rounded-2xl font-display font-medium text-xl outline-none border-2 border-transparent focus:border-brand-primary transition-all dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <select
                      value={newExpense.currency}
                      onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                      className="w-full h-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl font-medium text-sm outline-none border-2 border-transparent focus:border-brand-primary dark:text-white"
                    >
                      {SUPPORTED_CURRENCIES.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sector</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl font-medium outline-none border-2 border-transparent focus:border-brand-primary dark:text-white text-sm"
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl font-medium outline-none border-2 border-transparent focus:border-brand-primary dark:text-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Intelligence Note</label>
                <input
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-2xl font-medium outline-none border-2 border-transparent focus:border-brand-primary dark:text-white text-sm"
                  placeholder="e.g., Starbucks Shinjuku"
                />
              </div>

              <button
                onClick={handleAddExpense}
                className="w-full px-6 py-3 bg-brand-primary text-white font-medium text-xs uppercase tracking-widest rounded-2xl shadow-2xl shadow-indigo-500/30 hover:bg-brand-secondary transition-all active:scale-95"
              >
                Seal Ledger Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Expense Modal */}
      <SplitExpenseModal
        isOpen={showSplitModal}
        onClose={() => setShowSplitModal(false)}
        onSubmit={handleAddSplitExpense}
        collaborators={trip.collaborators}
        ownerEmail={trip.ownerEmail}
        tripCurrency="USD"
      />

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          trip={trip}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onConfirm={confirmDeleteExpense}
        onCancel={cancelDelete}
        title="Delete Expense?"
        message="Are you sure you want to delete this expense? This action cannot be undone and will permanently remove it from your trip budget."
        itemType="expense"
      />

      <style>{`
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default BudgetTab;
