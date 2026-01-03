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

#### Modal Design Pattern
TripFlow uses a compact, modern modal design for consistency and professional appearance:

```tsx
// Modal container - compact sizing
<div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/95 backdrop-blur-3xl">
  <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[2.5rem] sm:rounded-[3.5rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 border border-white/5 flex flex-col max-h-[90vh]">

    {/* Modal Header - compact padding */}
    <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 flex-shrink-0">
      <h3 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">Modal Title</h3>
      <button className="w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center justify-center transition-all text-slate-400 flex-shrink-0">
        <X size={20} />
      </button>
    </div>

    {/* Modal Content - compact spacing */}
    <div className="p-6 sm:p-8 space-y-8 overflow-y-auto no-scrollbar">
      {/* Inputs - py-3 for ~38px height */}
      <input className="px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl outline-none dark:text-white border-2 border-transparent focus:border-brand-primary/20 transition-all text-sm font-medium" />

      {/* Buttons - py-3 for ~38px height */}
      <button className="px-6 py-3 bg-brand-primary text-white rounded-2xl font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all">
        Action
      </button>

      {/* List items - p-4 padding, space-y-2 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all">
          <div className="flex items-center gap-3">
            <img className="w-10 h-10 rounded-xl object-cover shadow-md" />
            <p className="text-sm font-semibold">Content</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Key sizing principles:**

- Modal padding: `p-6 sm:p-8` (desktop: 32px, mobile: 24px)
- Section spacing: `space-y-8` (32px between sections)
- Input/button height: `py-3` (~38px total height)
- List item padding: `p-4` (16px all around)
- Avatars: `w-10 h-10` (40px square)
- Icons: 14-16px for buttons, 20px for close button
- Border radius: `rounded-2xl` (16px) for most elements, `rounded-xl` (12px) for smaller items
- Font weights: Use `font-medium` instead of `font-bold` for modern, less "chunky" appearance

**ESC key handling:**
Always add ESC key support for modal dismissal:

```typescript
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (modalOpen) setModalOpen(false);
    }
  };

  window.addEventListener('keydown', handleEscape);
  return () => window.removeEventListener('keydown', handleEscape);
}, [modalOpen]);
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
- `/todos` - View feature roadmap and todo list
- `/add-todo "P2 | feature/name | Description"` - Add new todo item
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

### Invitation System Issues

⚠️ **CRITICAL: Edge Function Authentication Configuration**

The `send-invitation` Edge Function requires special authentication configuration. Do not modify these settings without understanding the implications.

**Problem**: Edge Function returns 401 Unauthorized errors despite valid JWT token.

**Root Cause**: Supabase Edge Functions have two authentication layers:

1. **Platform-level JWT verification** (`verify_jwt` setting) - Supabase validates JWT before function runs
2. **Function-level authentication** (`auth.getUser(token)`) - Function code explicitly validates user

When both layers are enabled (default), they conflict because our function code already handles authentication explicitly ([send-invitation/index.ts:43-79](supabase/functions/send-invitation/index.ts#L43-L79)).

**Solution**: Deploy with platform-level JWT verification disabled:

```bash
npx supabase functions deploy send-invitation --no-verify-jwt --project-ref xnmbvjlhwrukliuzhhvf
```

**Why This Works**:

- Function code handles authentication explicitly with `auth.getUser(token)`
- Checks user permissions (owner or Editor role)
- Validates invitation business logic
- Platform-level verification is redundant and causes conflicts

**Related Fixes**:

- Invitation acceptance flow: [AcceptInvitation.tsx:83-91](components/AcceptInvitation.tsx#L83-L91) stores redirect URL in sessionStorage
- Auto-redirect after login: [useSupabaseAuth.ts:76-82](hooks/useSupabaseAuth.ts#L76-L82) checks for pending invitation URL
- Avatar imports: [20260103190000_fix_avatar_import_from_oauth.sql](supabase/migrations/20260103190000_fix_avatar_import_from_oauth.sql) extracts Google OAuth avatars
- Email logo: Uses emoji (✈️) instead of external image for email client compatibility

## Documentation Organization

### Folder Structure

```
TripFlow/
├── README.md              # Project overview (root - don't move)
├── CLAUDE.md              # Claude Code config (root - don't move)
├── TODOS.md               # Feature roadmap (root - don't move)
├── SECURITY.md            # Security guidelines (root - don't move)
│
├── docs/                  # Detailed documentation
│   ├── README.md          # Documentation index
│   ├── guides/            # How-to guides
│   │   ├── getting-started.md
│   │   ├── development.md
│   │   └── deployment.md
│   ├── architecture/      # Technical design
│   │   ├── overview.md
│   │   ├── components.md
│   │   └── data-flow.md
│   ├── api/               # API references
│   │   ├── types.md
│   │   ├── services.md
│   │   └── integrations.md
│   └── design/            # Design documentation
│       ├── design-system.md
│       └── ui-patterns.md
│
└── .claude/               # Claude Code configuration
    ├── agents/            # Agent definitions
    │   └── design-review.md
    ├── context/           # Context files
    │   └── design-principles.md
    └── skills/            # Slash commands
        ├── code-review.md
        ├── security-review.md
        ├── todos.md
        └── add-todo.md
```

### Documentation Guidelines

#### What Goes Where

| Document Type | Location | Examples |
|---------------|----------|----------|
| Project overview | Root | README.md |
| Coding standards | Root | CLAUDE.md |
| Task tracking | Root | TODOS.md |
| Security policy | Root | SECURITY.md |
| How-to guides | `docs/guides/` | Getting started, deployment |
| Architecture docs | `docs/architecture/` | System design, data flow |
| API references | `docs/api/` | Types, services |
| Design docs | `docs/design/` | Design system, UI patterns |
| Claude Code skills | `.claude/skills/` | Slash commands |
| Claude Code agents | `.claude/agents/` | Automated agents |
| Claude context | `.claude/context/` | Design principles |

#### Creating New Documentation

1. **Choose the correct folder** based on document type
2. **Follow the template**:
   ```markdown
   # Document Title

   > Brief description of what this document covers

   ## Overview
   [Introduction and context]

   ## [Main Sections]
   [Content with clear headings]

   ## Related Documentation
   - [Links to related docs]
   ```
3. **Update index files** when adding new docs:
   - Add to `docs/README.md` for general docs
   - Update CLAUDE.md Resources section for important refs
4. **Keep docs in sync** with code changes

#### Linking Between Documents

```markdown
<!-- From docs/ to root -->
[CLAUDE.md](../CLAUDE.md)
[TODOS.md](../TODOS.md)

<!-- From docs/ to .claude/ -->
[Design Principles](../.claude/context/design-principles.md)

<!-- Within docs/ -->
[Architecture Overview](../architecture/overview.md)
```

### Task Management

#### TODOS.md Structure
- **Root location**: `/TODOS.md`
- **Priority levels**: P0 (Critical) → P4 (Wishlist)
- **Status markers**: `[ ]` pending, `[~]` in-progress, `[x]` completed
- **Format**: `- [ ] **P2** | \`feature/name\` | Description`

#### Slash Commands
- `/todos` - View todo list with filtering options
- `/add-todo "P2 | feature/name | Description"` - Add new item

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
