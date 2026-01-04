/**
 * Export Modal Component
 *
 * Interface for exporting trip data in various formats (PDF, CSV)
 */

import React, { useState } from 'react';
import { X, FileText, Table, Printer, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Trip } from '../../types';
import {
  downloadExpensesCSV,
  downloadTripSummaryCSV,
  downloadExpenseReportHTML,
  printExpenseReport,
} from '../../utils/exportHelpers';

interface ExportModalProps {
  trip: Trip;
  onClose: () => void;
}

type ExportFormat = 'expense-csv' | 'summary-csv' | 'report-html' | 'report-print';

const ExportModal: React.FC<ExportModalProps> = ({ trip, onClose }) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('expense-csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const formats: Array<{
    id: ExportFormat;
    name: string;
    description: string;
    icon: React.ReactNode;
    action: () => void;
  }> = [
    {
      id: 'expense-csv',
      name: 'Expenses (CSV)',
      description: 'Export expense list as CSV for spreadsheet software',
      icon: <Table className="w-6 h-6" />,
      action: () => downloadExpensesCSV(trip),
    },
    {
      id: 'summary-csv',
      name: 'Full Trip Summary (CSV)',
      description: 'Export complete trip data including itinerary and packing list',
      icon: <FileText className="w-6 h-6" />,
      action: () => downloadTripSummaryCSV(trip),
    },
    {
      id: 'report-html',
      name: 'Expense Report (HTML)',
      description: 'Download formatted expense report as HTML file',
      icon: <Download className="w-6 h-6" />,
      action: () => downloadExpenseReportHTML(trip),
    },
    {
      id: 'report-print',
      name: 'Print Expense Report',
      description: 'Open printable expense report (save as PDF from print dialog)',
      icon: <Printer className="w-6 h-6" />,
      action: () => printExpenseReport(trip),
    },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setError('');

    try {
      const selectedExport = formats.find(f => f.id === selectedFormat);
      if (selectedExport) {
        selectedExport.action();
        setExportSuccess(true);

        // Auto-close after success
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Export failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Export failed. Please try again.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-20 pb-20 md:pb-0 px-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between rounded-t-[2.5rem]">
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
              Export Trip Data
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Download or print {trip.name} in various formats
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Select Export Format
            </label>
            <div className="grid grid-cols-1 gap-3">
              {formats.map(format => (
                <button
                  key={format.id}
                  type="button"
                  onClick={() => setSelectedFormat(format.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    selectedFormat === format.id
                      ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        selectedFormat === format.id
                          ? 'bg-brand-primary text-white'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {format.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`text-base font-bold ${
                            selectedFormat === format.id
                              ? 'text-brand-primary'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {format.name}
                        </h3>
                        {selectedFormat === format.id && (
                          <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Export Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Tip:</strong> For PDF exports, choose "Print Expense Report" and select
              "Save as PDF" in your browser's print dialog.
            </p>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expenses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {trip.expenses.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Activities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {trip.itinerary.length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {trip.packingList.length}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || exportSuccess}
            className={`w-full p-5 rounded-[1.5rem] font-bold transition-all shadow-lg hover:shadow-xl ${
              exportSuccess
                ? 'bg-green-500 text-white'
                : isExporting
                ? 'bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-brand-primary text-white hover:bg-brand-primary-dark'
            }`}
          >
            {exportSuccess ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Export Successful!
              </span>
            ) : isExporting ? (
              'Exporting...'
            ) : (
              `Export ${formats.find(f => f.id === selectedFormat)?.name}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
