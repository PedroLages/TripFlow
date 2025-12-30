# TripFlow - Claude Code Configuration

> Smart trip planning application with integrated AI-powered code review, security scanning, and design validation

## Project Overview

**TripFlow** is a React-based single-page application for comprehensive trip planning. Users can create trips, manage itineraries, track budgets, organize packing lists, store travel documents, and collaborate with other travelers.

### Tech Stack
- **Frontend**: React 19.2 + TypeScript 5.8
- **Build Tool**: Vite 6.2
- **Routing**: React Router v7
- **UI Library**: Lucide React (icons)
- **Charts**: Recharts
- **Date Handling**: date-fns
- **AI Integration**: Google Gemini API (@google/genai)

### Project Structure
```
TripFlow/
├── components/           # React components
│   ├── Dashboard.tsx    # Main dashboard with trip cards
│   ├── TripDetail.tsx   # Individual trip view with tabs
│   ├── TripForm.tsx     # Trip creation/edit form
│   ├── Sidebar.tsx      # Desktop navigation
│   ├── MobileNav.tsx    # Mobile navigation
│   └── tabs/            # Tab components for trip details
│       ├── ItineraryTab.tsx
│       ├── BudgetTab.tsx
│       ├── PackingTab.tsx
│       ├── DocumentsTab.tsx
│       ├── WishlistTab.tsx
│       └── MapTab.tsx
├── types.ts             # TypeScript type definitions
├── data.ts              # Mock data and initial state
├── App.tsx              # Main app component with routing
├── index.tsx            # Application entry point
└── vite.config.ts       # Vite configuration
```

## Coding Standards & Conventions

### TypeScript Best Practices

#### Type Definitions
All types are defined in [types.ts](types.ts). Key types:
- `Trip` - Main trip object containing all trip-related data
- `Activity` - Individual itinerary item
- `Expense` - Budget expense entry
- `TravelDocument` - Stored documents (flights, hotels, etc.)
- `PackingItem` - Packing list item
- `WishlistPlace` - Places user wants to visit

**Always import types from types.ts**:
```typescript
import type { Trip, Expense, Activity } from './types';
```

#### Avoid `any`
```typescript
// ❌ Bad
const handleSubmit = (data: any) => { ... }

// ✅ Good
const handleSubmit = (data: Trip) => { ... }
```

#### Use proper function types
```typescript
// ❌ Bad
interface Props {
  onSubmit: Function;
}

// ✅ Good
interface Props {
  onSubmit: (trip: Trip) => void;
}
```

### React Patterns

#### Component Structure
```typescript
import React from 'react';
import { IconName } from 'lucide-react';
import type { Trip } from './types';

interface ComponentProps {
  prop1: string;
  prop2?: number;
  onAction: () => void;
}

export function Component({ prop1, prop2 = 0, onAction }: ComponentProps) {
  // Hooks at the top
  const [state, setState] = React.useState<string>('');
  
  React.useEffect(() => {
    // Side effects
    return () => {
      // Cleanup
    };
  }, [dependencies]);

  // Event handlers
  const handleClick = () => {
    // Handle event
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

#### State Management
- Use `useState` for local component state
- Lift state up when sharing between components
- Consider `useReducer` for complex state logic
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations

#### Performance Optimization
```typescript
// Memoize expensive components
export const ExpensiveComponent = React.memo(({ data }: Props) => {
  // Component logic
});

// Memoize callbacks
const handleUpdate = React.useCallback((id: string) => {
  updateTrip(id);
}, [updateTrip]);

// Memoize calculations
const totalExpenses = React.useMemo(() => {
  return expenses.reduce((sum, exp) => sum + exp.amount, 0);
}, [expenses]);
```

### Styling Conventions

#### Tailwind CSS Classes
Use Tailwind utility classes consistently:
```tsx
// Layout
<div className="flex items-center justify-between gap-4">

// Spacing
<div className="p-6 mb-4">  // padding-24px, margin-bottom-16px

// Typography
<h2 className="text-2xl font-semibold text-gray-900">

// Colors
<div className="bg-blue-500 text-white">

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

#### Component Styling Pattern
```tsx
// Group by concern for readability
<button className={`
  // Layout & Size
  px-4 py-2 rounded-lg
  
  // Colors & States
  bg-blue-500 hover:bg-blue-600 text-white
  
  // Effects & Transitions
  shadow-md hover:shadow-lg transition-all
  
  // Responsive
  text-sm md:text-base
`}>
  Button
</button>
```

### Data Handling

#### Date Formatting
Always use `date-fns` for date operations:
```typescript
import { format, formatDistance, isAfter, isBefore, parseISO } from 'date-fns';

// Display format
format(new Date(trip.startDate), 'MMM d, yyyy'); // "Jan 15, 2024"

// Relative time
formatDistance(new Date(trip.startDate), new Date(), { addSuffix: true }); // "in 5 days"

// Comparisons
isAfter(new Date(trip.endDate), new Date()); // Check if trip is upcoming
```

#### Currency Formatting
```typescript
const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};
```

#### Budget Calculations
```typescript
// Always validate amounts
const calculateTotal = (expenses: Expense[]) => {
  return expenses.reduce((sum, expense) => {
    const amount = typeof expense.amount === 'number' && 
                   isFinite(expense.amount) && 
                   expense.amount >= 0
      ? expense.amount
      : 0;
    return sum + amount;
  }, 0);
};
```

### Error Handling

#### User-Facing Errors
```typescript
try {
  await saveTrip(tripData);
} catch (error) {
  // Show user-friendly message
  setError('Unable to save trip. Please check your connection and try again.');
  console.error('Save failed:', error);
}
```

#### Form Validation
```typescript
const validateTrip = (trip: Partial<Trip>): string[] => {
  const errors: string[] = [];
  
  if (!trip.name || trip.name.trim().length === 0) {
    errors.push('Trip name is required');
  }
  
  if (!trip.startDate || !trip.endDate) {
    errors.push('Start and end dates are required');
  }
  
  if (trip.startDate && trip.endDate && 
      isAfter(new Date(trip.startDate), new Date(trip.endDate))) {
    errors.push('End date must be after start date');
  }
  
  return errors;
};
```

### Accessibility Requirements

#### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Tab order should be logical
- Escape key closes modals/dropdowns
- Enter/Space activates buttons

#### ARIA Labels
```tsx
// Icon buttons need labels
<button aria-label="Delete trip" onClick={handleDelete}>
  <Trash2 className="w-5 h-5" />
</button>

// Form inputs need labels
<label htmlFor="trip-name" className="block text-sm font-medium">
  Trip Name
</label>
<input 
  id="trip-name" 
  type="text" 
  className="..."
/>
```

#### Focus Management
```tsx
// Visible focus indicators
<button className="... focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Click me
</button>
```

### Security Guidelines

#### Input Sanitization
```typescript
// Never render user HTML directly
// ❌ Dangerous
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ Safe - render as text
<div>{userInput}</div>

// ✅ Safe - sanitize if HTML needed
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

#### API Key Security
```typescript
// ❌ Never hardcode API keys
const API_KEY = "AIzaSyC...";

// ✅ Use environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ⚠️ Note: Client-side env vars are still exposed in bundle
// For production, use a backend proxy to hide keys
```

#### File Upload Validation
```typescript
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const validateFile = (file: File): string | null => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return 'Invalid file type. Only JPEG, PNG, and PDF allowed.';
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return 'File too large. Maximum size is 10MB.';
  }
  
  return null; // Valid
};
```

## Automated Workflows

### Code Review Workflow
**Trigger**: Pull requests (opened, synchronized, ready for review)  
**File**: [.github/workflows/claude-code-review.yml](.github/workflows/claude-code-review.yml)

Reviews code for:
- Architecture and component patterns
- TypeScript type safety
- Security vulnerabilities
- Performance optimizations
- Accessibility compliance
- TripFlow-specific conventions

**Manual Trigger**: Use `/code-review` slash command  
**Configuration**: [.claude/skills/code-review.md](.claude/skills/code-review.md)

### Security Review Workflow
**Trigger**: Pull requests (opened, synchronized, ready for review)  
**File**: [.github/workflows/security-review.yml](.github/workflows/security-review.yml)

Scans for:
- XSS vulnerabilities
- API key exposure
- Input validation issues
- File upload security
- Data sanitization problems

**Manual Trigger**: Use `/security-review` slash command  
**Configuration**: [.claude/skills/security-review.md](.claude/skills/security-review.md)

### Design Review Process
**Trigger**: Manual activation for UI/UX changes  
**Agent**: [.claude/agents/design-review.md](.claude/agents/design-review.md)

Reviews:
- Visual consistency and design principles
- Responsive design (mobile/tablet/desktop)
- Accessibility (WCAG 2.1 AA)
- Interactive states and animations
- Component patterns and code quality

**Reference**: [Design Principles](.claude/context/design-principles.md)

## Setup Instructions

### GitHub Actions Setup

1. **Generate OAuth Token from Claude Code CLI**

   ```bash
   claude auth token
   ```

   This outputs your OAuth token tied to your Claude Code subscription.

2. **Add OAuth Token to GitHub Secrets**
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CLAUDE_CODE_OAUTH_TOKEN`
   - Value: Paste the token from step 1

3. **Workflows are automatically triggered on PRs**
   - Code review runs on every PR
   - Security scan runs on every PR
   - Check PR comments for automated feedback

**Note**: The workflows use `claude_code_oauth_token` which leverages your Claude Code subscription. This is different from `anthropic_api_key` which requires separate API credits.

**Workflow Badges**: The status badges in README.md will show as "unknown" until workflows run successfully for the first time. After the first successful PR review, badges will display proper status.

### Playwright Setup for Design Reviews

To run comprehensive design reviews using the design-review agent:

1. **Install Playwright**

   ```bash
   npm install -D @playwright/test
   npx playwright install
   ```

2. **Configure Playwright MCP Server**

   If using Claude Code with MCP support, add to your MCP configuration:

   ```json
   {
     "mcpServers": {
       "playwright": {
         "command": "npx",
         "args": ["-y", "@playwright/mcp-server"]
       }
     }
   }
   ```

3. **Start Dev Server for Testing**

   ```bash
   npm run dev
   # Server will be available at http://localhost:5173 (or next available port)
   ```

4. **Run Design Review**

   Use the `/design-review` slash command in Claude Code, or manually invoke the design-review agent from `.claude/agents/design-review.md`.

**Note**: Design reviews require a running preview/dev environment to test interactive elements, responsiveness, and accessibility.

### Local Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create `.env` file (do not commit):
```env
VITE_GEMINI_API_KEY=your_api_key_here
```

### Claude Code Skills

Skills are available via slash commands in Claude Code:

- `/code-review` - Run comprehensive code review on current changes
- `/security-review` - Run security scan on current changes
- Design reviews are triggered by calling the design-review agent

## Common Patterns

### Creating New Components

1. Define props interface using types from `types.ts`
2. Use functional components with hooks
3. Add proper TypeScript typing
4. Include accessibility attributes
5. Use Tailwind for styling
6. Add error boundaries for complex components

### Adding New Trip Features

1. Update `Trip` type in `types.ts` if needed
2. Update `data.ts` with sample data
3. Create new component or modify existing
4. Update relevant tabs in TripDetail
5. Test with empty states and edge cases
6. Ensure mobile responsiveness

### Form Handling Pattern

```typescript
const [formData, setFormData] = useState<Partial<Trip>>({});
const [errors, setErrors] = useState<string[]>([]);

const handleChange = (field: keyof Trip) => (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  setFormData(prev => ({ ...prev, [field]: e.target.value }));
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate
  const validationErrors = validateTrip(formData);
  if (validationErrors.length > 0) {
    setErrors(validationErrors);
    return;
  }
  
  // Submit
  try {
    await saveTrip(formData as Trip);
    // Success handling
  } catch (error) {
    setErrors(['Failed to save trip']);
  }
};
```

## Testing Guidelines

### What to Test
- Budget calculations (totals, remaining, percentages)
- Date validations (start < end, date parsing)
- Form submissions with valid/invalid data
- Empty states and error handling
- Component rendering with different data
- User interactions (clicks, form inputs)

### Testing Pattern
```typescript
// For complex logic, extract to utility function
export const calculateBudgetStatus = (
  budget: number, 
  expenses: Expense[]
): { spent: number; remaining: number; percentage: number } => {
  const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = budget - spent;
  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  
  return { spent, remaining, percentage };
};

// Then test the utility
describe('calculateBudgetStatus', () => {
  it('calculates correctly with positive budget', () => {
    const result = calculateBudgetStatus(1000, [
      { amount: 250 },
      { amount: 150 }
    ]);
    expect(result.spent).toBe(400);
    expect(result.remaining).toBe(600);
    expect(result.percentage).toBe(40);
  });
});
```

## Troubleshooting

### Common Issues

**Build Errors**
- Ensure all imports have correct paths
- Check TypeScript errors: `npx tsc --noEmit`
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

**Type Errors**
- Make sure types are imported from `types.ts`
- Check that all required props are provided
- Verify function signatures match expected types

**Runtime Errors**
- Check browser console for specific errors
- Verify data structure matches `Trip` type
- Check for null/undefined values

**Styling Issues**
- Verify Tailwind classes are correct
- Check for conflicting styles
- Test responsive classes at different breakpoints

## Resources

### Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [date-fns](https://date-fns.org/docs/)
- [Recharts](https://recharts.org/)
- [Lucide Icons](https://lucide.dev/)

### TripFlow Resources
- [Design Principles](.claude/context/design-principles.md)
- [Code Review Skill](.claude/skills/code-review.md)
- [Security Review Skill](.claude/skills/security-review.md)
- [Design Review Agent](.claude/agents/design-review.md)

### Claude Code Workflows
Based on patterns from [claude-code-workflows](https://github.com/OneRedOak/claude-code-workflows):
- Pragmatic code review focusing on high-impact issues
- High-confidence security scanning (>80% confidence threshold)
- Comprehensive design review with Playwright testing

---

**Last Updated**: 2025-12-30  
**Maintained By**: TripFlow Team  
**Claude Code Version**: Compatible with Claude Code CLI and SDK
