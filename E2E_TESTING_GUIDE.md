# End-to-End Testing Guide for TripFlow Phase 2 Features

> Manual testing scenarios for real-time currency conversion, partial payments, receipt storage, analytics, and export functionality

## Prerequisites

- Development server running: `npm run dev`
- Browser DevTools open (for monitoring network requests and console)
- Test trip created with expenses

---

## Test 1: Real-Time Currency Conversion with Live Rates

### Objective
Verify that the CurrencyService fetches live exchange rates from ExchangeRate-API and caches them in IndexedDB.

### Test Steps

#### 1.1 Initial Currency Conversion (Live API)
1. Open browser DevTools → Application → IndexedDB
2. Confirm `tripflow-db` database exists but is empty (or delete existing data)
3. Create a new trip with budget of $1000 USD
4. Add an expense: "Hotel" - $500 USD
5. Click the currency dropdown and select **EUR**
6. **Expected**:
   - Network tab shows request to `https://open.exchangerate-api.com/v6/latest/USD`
   - Budget and expense amounts convert to EUR (approximately €460 based on current rates)
   - Console shows: `"CurrencyService: Fetched live rates for USD"`

#### 1.2 Cached Rates (No API Call)
1. Change currency back to **USD** and then to **EUR** again
2. **Expected**:
   - No new network request to ExchangeRate-API
   - Conversion happens instantly
   - Console shows: `"CurrencyService: Using cached rates for USD (age: X minutes)"`

#### 1.3 Cache Expiration (After 24 hours)
1. Open DevTools → Application → IndexedDB → tripflow-db → exchangeRates
2. Edit the `fetchedAt` timestamp to be 25 hours ago
3. Change currency from USD to EUR
4. **Expected**:
   - New network request to ExchangeRate-API
   - Console shows: `"CurrencyService: Cache expired for USD, fetching fresh rates"`

#### 1.4 Offline Fallback (Static Rates)
1. Open DevTools → Network tab
2. Set throttling to **Offline**
3. Clear IndexedDB cache (delete exchangeRates entries)
4. Try changing currency from USD to EUR
5. **Expected**:
   - Console shows: `"Failed to fetch live rates, falling back to cached rates"`
   - Console shows: `"CurrencyService: Using static fallback rates"`
   - Conversion uses static rates from currencyHelpers.ts

#### 1.5 Multi-Currency Trip
1. Go back **Online**
2. Create expenses in different currencies:
   - "Flight" - $800 USD
   - "Hotel" - €400 EUR
   - "Dinner" - £50 GBP
3. Set trip currency to **USD**
4. **Expected**:
   - All expenses convert to USD
   - Budget progress bar shows total in USD
   - Each expense card shows original currency + USD equivalent

---

## Test 2: Partial Payment Tracking Workflow

### Objective
Verify split expense creation, partial payments, and settlement calculations.

### Test Steps

#### 2.1 Create Split Expense
1. Navigate to Budget tab
2. Click **"+ Add Expense"** → **"Split Expense"**
3. Fill out split expense form:
   - **Category**: Accommodation
   - **Description**: "Beach House Rental"
   - **Amount**: $1200
   - **Paid By**: Select your email
   - **Split Method**: Equal
   - **Participants**: Select 4 people (you + 3 collaborators)
4. Click **"Create Split Expense"**
5. **Expected**:
   - Expense appears with split badge showing 4 participants
   - Each person's split shows $300
   - Split status shows "Unpaid" (red badge)

#### 2.2 Record Partial Payment
1. Click on the split expense card
2. In the split details modal, find a participant
3. Click **"Mark as Paid"** for one participant
4. **Expected**:
   - Participant's status changes to "Paid" (green checkmark)
   - Payment progress bar shows 25% paid
   - Split badge changes to orange (partially paid)

#### 2.3 Complete All Payments
1. Mark remaining 3 participants as paid
2. **Expected**:
   - Progress bar shows 100% paid
   - Split badge changes to green (fully paid)
   - Split status shows "Fully Paid"

#### 2.4 Installment Payments
1. Create a new split expense with **installments enabled**
2. Set installment plan: 3 payments of $100 each
3. Click **"Record Payment"** for participant 1
4. Enter payment details:
   - Amount: $100
   - Date: Today
   - Notes: "First installment"
5. **Expected**:
   - Payment appears in payment history ledger
   - Progress bar shows 33.3% paid
   - Remaining balance: $200

#### 2.5 Settlement Calculations
1. Navigate to **Settlements tab**
2. **Expected**:
   - Summary shows "You owe" and "You're owed" totals
   - Simplified settlements list (minimized transactions)
   - Each settlement card shows amount and participants involved

#### 2.6 Mark Settlement as Paid
1. Click **"Mark as Paid"** on a settlement
2. **Expected**:
   - Settlement moves to "Completed" section
   - Balance updates accordingly
   - Green checkmark appears

---

## Test 3: Receipt Image Upload and Compression

### Objective
Verify receipt image upload, validation, compression, and thumbnail generation.

### Test Steps

#### 3.1 Valid Image Upload
1. Go to Budget tab → Select an expense
2. Click **"Add Receipt"** button
3. Upload a JPEG image (e.g., 5MB photo of receipt)
4. **Expected**:
   - Upload progress indicator appears
   - Image compresses automatically
   - Thumbnail generates (150x150px)
   - Receipt icon badge appears on expense card
   - Console shows: `"Compressed image from 5MB to ~1.2MB"`

#### 3.2 File Size Validation
1. Try uploading a file larger than 10MB
2. **Expected**:
   - Error message: "File size exceeds maximum allowed size (10MB)"
   - Upload rejected

#### 3.3 File Type Validation
1. Try uploading a .txt or .zip file
2. **Expected**:
   - Error message: "Invalid file type. Only JPEG, PNG, WebP allowed"
   - Upload rejected

#### 3.4 Receipt Viewer
1. Click the receipt icon on an expense card
2. **Expected**:
   - Modal opens with full-size receipt image
   - Navigation arrows if multiple receipts (← →)
   - Delete button with confirmation dialog

#### 3.5 Delete Receipt
1. In receipt viewer, click **"Delete"** button
2. Confirm deletion in custom dialog
3. **Expected**:
   - Receipt removed from expense
   - Receipt icon badge disappears
   - Confirmation: "Receipt deleted successfully"

---

## Test 4: Analytics Dashboard Calculations

### Objective
Verify analytics tab displays correct spending trends, category breakdowns, and insights.

### Test Steps

#### 4.1 Category Breakdown Chart
1. Navigate to **Analytics tab**
2. **Expected**:
   - Pie chart shows spending by category
   - Percentages add up to 100%
   - Largest category highlighted
   - Legend shows category names + amounts

#### 4.2 Daily Spending Trend
1. Scroll to "Spending Over Time" chart
2. **Expected**:
   - Line chart shows cumulative spending
   - X-axis: Trip dates
   - Y-axis: Amount in trip currency
   - Data points for each day

#### 4.3 Per-Person Spending
1. Scroll to "Spending by Person" section
2. **Expected**:
   - Bar chart shows total spent per person
   - Sorted from highest to lowest
   - Hover shows breakdown by category

#### 4.4 Budget Insights
1. Review "Insights & Recommendations" section
2. **Test Budget States**:
   - **Under 50% budget**: Expect "Well within budget" success message
   - **80-100% budget**: Expect "Approaching budget limit" warning
   - **Over budget**: Expect "Over budget by $X" warning with percentage

#### 4.5 Spending Patterns
1. Create high-spending days (>150% of daily average)
2. **Expected**:
   - Insight: "X days with above-average spending"
   - Info icon with details

#### 4.6 Category Dominance
1. Make one category >40% of total spending
2. **Expected**:
   - Insight: "Category accounts for X% of spending"

---

## Test 5: Export Functionality (CSV/PDF)

### Objective
Verify CSV export, PDF generation, and print functionality work correctly.

### Test Steps

#### 5.1 CSV Export (All Expenses)
1. Go to Budget tab
2. Click **"Export"** button → **"Export to CSV"**
3. Select format: **"All Expenses"**
4. Click **"Export CSV"**
5. **Expected**:
   - File downloads: `TripName_expenses.csv`
   - Open in Excel/Google Sheets
   - Verify columns: Date, Category, Description, Amount, Currency, Paid By, Split (Y/N)
   - Check for proper CSV escaping (commas in descriptions)

#### 5.2 CSV Export (Split Expenses Only)
1. Export again with format: **"Split Expenses Only"**
2. **Expected**:
   - Only split expenses included
   - Additional columns: Participants, Split Method, Individual Share

#### 5.3 CSV Export (Category Summary)
1. Export with format: **"Category Summary"**
2. **Expected**:
   - Rows: One per category
   - Columns: Category, Total Amount, Count, Average, Percentage
   - Totals row at bottom

#### 5.4 HTML Expense Report
1. Click **"Export"** → **"Generate Report"**
2. Click **"Download HTML"**
3. **Expected**:
   - File downloads: `TripName_report.html`
   - Open in browser
   - Verify structure:
     - Trip header with dates and budget
     - Expense table (all fields)
     - Category breakdown section
     - Summary statistics

#### 5.5 Print Expense Report
1. Click **"Print Report"**
2. **Expected**:
   - Browser print dialog opens
   - Preview shows formatted report
   - Print-optimized CSS (no dark mode, proper page breaks)

#### 5.6 Export Error Handling
1. Create a trip with **no expenses**
2. Try exporting to CSV
3. **Expected**:
   - Error message: "No expenses to export"
   - Export button disabled or shows warning

#### 5.7 Special Characters in CSV
1. Create expense with description: `"Lunch, dinner & snacks"`
2. Export to CSV
3. Open in Excel
4. **Expected**:
   - Description properly escaped: `"Lunch, dinner & snacks"`
   - No CSV parsing errors

---

## Test 6: Mobile Responsiveness

### Objective
Verify all Phase 2 components work correctly on mobile viewports.

### Test Steps

#### 6.1 Mobile Viewport Setup
1. Open DevTools → Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
2. Select device: **iPhone 14 Pro** (390x844)
3. Test all features from Tests 1-5 on mobile viewport

#### 6.2 Key Mobile Checks
- Currency dropdown: Accessible and doesn't overflow
- Split expense modal: Scrollable, all buttons reachable
- Receipt viewer: Swipe navigation works, images fit screen
- Analytics charts: Responsive, legible on small screens
- Export modal: All options visible without horizontal scroll
- Settlement cards: Stack vertically, tap targets ≥44x44px

#### 6.3 Tablet Viewport
1. Switch to **iPad Air** (820x1180)
2. Verify layouts adapt correctly
3. Check that desktop features aren't hidden

---

## Test 7: Error Handling & Edge Cases

### Objective
Verify graceful error handling and edge case behavior.

### Test Steps

#### 7.1 Network Errors
1. Set DevTools to **Offline**
2. Try changing currency
3. **Expected**: Fallback to static rates, no crashes

#### 7.2 Invalid Currency Codes
1. Manually edit localStorage to add expense with currency: "ZZZ"
2. Reload app
3. **Expected**: Displays "ZZZ" without crashing, no conversion attempted

#### 7.3 Empty State Handling
- Empty trip (no expenses): Analytics shows "No data to display"
- Empty settlements: "No settlements to display"
- No receipts: "No receipts uploaded"

#### 7.4 Large Numbers
1. Create expense with amount: `999999999.99`
2. **Expected**: Displays correctly with commas, no overflow

#### 7.5 Zero and Negative Amounts
- Zero amount expense: Allowed, doesn't break calculations
- Negative amount: Treated as refund/credit

---

## Success Criteria

### All Tests Pass When:
- ✅ No console errors during any test
- ✅ Currency conversion uses live rates when online
- ✅ Partial payments track correctly with progress indicators
- ✅ Receipt images upload, compress, and display properly
- ✅ Analytics calculations match manual verification
- ✅ CSV exports open correctly in Excel/Google Sheets
- ✅ PDF reports print with proper formatting
- ✅ All features work on mobile (390px width)
- ✅ Error states display helpful messages
- ✅ No data loss during network failures

---

## Automated Testing (Future Enhancement)

For CI/CD integration, consider adding:
- **Playwright** for E2E browser automation
- **MSW (Mock Service Worker)** for API mocking
- **Visual regression** testing with Percy or Chromatic

---

**Last Updated**: 2025-12-31
**Test Coverage**: Real-time currency conversion, partial payments, receipt storage, analytics, export features, mobile responsiveness
