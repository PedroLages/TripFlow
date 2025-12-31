/**
 * Export Helpers
 *
 * Utilities for exporting trip data to PDF and CSV formats
 */

import { format } from 'date-fns';
import type { Trip, Expense, Activity, PackingItem, TravelDocument } from '../types';
import { formatCurrency } from './currencyHelpers';

/**
 * Export trip expenses to CSV format
 *
 * @param trip - Trip to export expenses from
 * @returns CSV string with expense data
 */
export function exportExpensesToCSV(trip: Trip): string {
  const headers = [
    'Date',
    'Category',
    'Description',
    'Amount',
    'Currency',
    'Paid By',
    'Split Between',
    'Payment Status',
  ].join(',');

  const rows = trip.expenses.map(expense => {
    const date = expense.date || format(new Date(), 'yyyy-MM-dd');
    const category = escapeCSV(expense.category);
    const description = escapeCSV(expense.description || '');
    const amount = expense.amount.toFixed(2);
    const currency = expense.currency || 'USD';
    const paidBy = expense.paidBy || trip.ownerEmail;
    const splitBetween = expense.splits
      ? expense.splits.map(s => s.userId).join('; ')
      : '';
    const paymentStatus = expense.isSplit
      ? expense.splits?.every(s => s.isPaid)
        ? 'Fully Paid'
        : expense.splits?.some(s => s.isPaid)
        ? 'Partially Paid'
        : 'Unpaid'
      : 'N/A';

    return [
      date,
      category,
      description,
      amount,
      currency,
      paidBy,
      splitBetween,
      paymentStatus,
    ].join(',');
  });

  return [headers, ...rows].join('\n');
}

/**
 * Export complete trip summary to CSV
 *
 * @param trip - Trip to export
 * @returns CSV string with trip summary
 */
export function exportTripSummaryToCSV(trip: Trip): string {
  const sections: string[] = [];

  // Trip Info
  sections.push('TRIP INFORMATION');
  sections.push('Field,Value');
  sections.push(`Name,${escapeCSV(trip.name)}`);
  sections.push(`Destinations,${escapeCSV(trip.destinations.join(', '))}`);
  sections.push(`Start Date,${trip.startDate}`);
  sections.push(`End Date,${trip.endDate}`);
  sections.push(`Budget,${formatCurrency(trip.budget)}`);
  sections.push(`Total Spent,${formatCurrency(trip.expenses.reduce((sum, e) => sum + e.amount, 0))}`);
  sections.push('');

  // Expenses
  sections.push('EXPENSES');
  sections.push(exportExpensesToCSV(trip));
  sections.push('');

  // Itinerary
  if (trip.itinerary.length > 0) {
    sections.push('ITINERARY');
    sections.push('Date,Time,Title,Location,Description');
    trip.itinerary.forEach(activity => {
      sections.push([
        activity.date,
        activity.time,
        escapeCSV(activity.title),
        escapeCSV(activity.location || ''),
        escapeCSV(activity.description || ''),
      ].join(','));
    });
    sections.push('');
  }

  // Packing List
  if (trip.packingList.length > 0) {
    sections.push('PACKING LIST');
    sections.push('Item,Category,Quantity,Packed');
    trip.packingList.forEach(item => {
      sections.push([
        escapeCSV(item.item),
        item.category,
        item.quantity,
        item.isPacked ? 'Yes' : 'No',
      ].join(','));
    });
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Generate expense report PDF (HTML-based)
 *
 * @param trip - Trip to generate report for
 * @returns HTML string for PDF generation
 */
export function generateExpenseReportHTML(trip: Trip): string {
  const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = trip.budget - totalSpent;
  const budgetPercentage = trip.budget > 0 ? (totalSpent / trip.budget) * 100 : 0;

  // Group expenses by category
  const categoryTotals = trip.expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Expense Report - ${escapeHTML(trip.name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      padding: 40px;
      color: #1e293b;
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px solid #6366f1;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 8px;
    }
    .header .meta {
      color: #64748b;
      font-size: 14px;
    }
    .summary {
      background: #f1f5f9;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .summary-item h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .summary-item .value {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
    }
    .summary-item.warning .value { color: #ef4444; }
    .summary-item.success .value { color: #10b981; }
    .category-breakdown {
      margin-bottom: 30px;
    }
    .category-breakdown h2 {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #1e293b;
    }
    .category-item {
      display: flex;
      justify-content: space-between;
      padding: 12px;
      background: #f8fafc;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .category-item .name {
      font-weight: 600;
      color: #475569;
    }
    .category-item .amount {
      font-weight: 700;
      color: #1e293b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    table th {
      background: #6366f1;
      color: white;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    table td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    table tr:last-child td {
      border-bottom: none;
    }
    table tr:nth-child(even) {
      background: #f8fafc;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
      text-align: center;
      color: #94a3b8;
      font-size: 12px;
    }
    @media print {
      body { padding: 20px; }
      .summary { break-inside: avoid; }
      table { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Expense Report</h1>
    <div class="meta">
      <strong>${escapeHTML(trip.name)}</strong> •
      ${trip.destinations.map(escapeHTML).join(', ')} •
      ${trip.startDate} to ${trip.endDate}
    </div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <h3>Budget</h3>
      <div class="value">${formatCurrency(trip.budget)}</div>
    </div>
    <div class="summary-item ${budgetPercentage > 100 ? 'warning' : ''}">
      <h3>Total Spent</h3>
      <div class="value">${formatCurrency(totalSpent)}</div>
    </div>
    <div class="summary-item ${remaining >= 0 ? 'success' : 'warning'}">
      <h3>Remaining</h3>
      <div class="value">${formatCurrency(Math.abs(remaining))}</div>
    </div>
  </div>

  <div class="category-breakdown">
    <h2>Spending by Category</h2>
    ${Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => `
        <div class="category-item">
          <span class="name">${escapeHTML(category)}</span>
          <span class="amount">${formatCurrency(amount)}</span>
        </div>
      `).join('')}
  </div>

  <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">Expense Details</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Description</th>
        <th>Amount</th>
        <th>Paid By</th>
      </tr>
    </thead>
    <tbody>
      ${trip.expenses.map(expense => `
        <tr>
          <td>${expense.date || format(new Date(), 'MMM d, yyyy')}</td>
          <td>${escapeHTML(expense.category)}</td>
          <td>${escapeHTML(expense.description || '-')}</td>
          <td><strong>${formatCurrency(expense.amount, expense.currency)}</strong></td>
          <td>${escapeHTML(expense.paidBy || trip.ownerEmail)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated on ${format(new Date(), 'MMMM d, yyyy')} via TripFlow</p>
  </div>
</body>
</html>
  `;

  return html.trim();
}

/**
 * Download content as file
 *
 * @param content - File content
 * @param filename - Name of file to download
 * @param mimeType - MIME type of file
 */
export function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export expenses to CSV and download
 *
 * @param trip - Trip to export
 */
export function downloadExpensesCSV(trip: Trip): void {
  const csv = exportExpensesToCSV(trip);
  const filename = `${sanitizeFilename(trip.name)}-expenses-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Export trip summary to CSV and download
 *
 * @param trip - Trip to export
 */
export function downloadTripSummaryCSV(trip: Trip): void {
  const csv = exportTripSummaryToCSV(trip);
  const filename = `${sanitizeFilename(trip.name)}-summary-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  downloadFile(csv, filename, 'text/csv');
}

/**
 * Generate and download expense report as HTML (for printing to PDF)
 *
 * @param trip - Trip to generate report for
 */
export function downloadExpenseReportHTML(trip: Trip): void {
  const html = generateExpenseReportHTML(trip);
  const filename = `${sanitizeFilename(trip.name)}-report-${format(new Date(), 'yyyy-MM-dd')}.html`;
  downloadFile(html, filename, 'text/html');
}

/**
 * Open expense report in new window for printing (uses blob URL for security)
 *
 * @param trip - Trip to generate report for
 */
export function printExpenseReport(trip: Trip): void {
  const html = generateExpenseReportHTML(trip);

  // Create blob URL for safe HTML rendering
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  // Open in new window
  const printWindow = window.open(url, '_blank');

  if (printWindow) {
    // Wait for content to load, then trigger print and cleanup
    printWindow.onload = () => {
      printWindow.print();

      // Cleanup blob URL after a delay (allow print dialog to open)
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    };
  } else {
    // Cleanup and throw error for proper error handling
    URL.revokeObjectURL(url);
    throw new Error('Failed to open print window. Please check popup blocker settings and try again.');
  }
}

/**
 * Escape CSV special characters
 *
 * @param value - Value to escape
 * @returns Escaped value
 */
function escapeCSV(value: string): string {
  if (!value) return '';

  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * Escape HTML special characters
 *
 * @param value - Value to escape
 * @returns Escaped value
 */
function escapeHTML(value: string): string {
  if (!value) return '';

  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize filename for safe file downloads
 *
 * @param filename - Original filename
 * @returns Sanitized filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
