# Development Guide

> Coding standards, workflows, and best practices for TripFlow development

## Development Workflow

### 1. Branch Strategy

```
main                 # Production-ready code
├── feature/xxx      # New features
├── fix/xxx          # Bug fixes
├── chore/xxx        # Maintenance tasks
└── docs/xxx         # Documentation updates
```

**Naming Convention**:
```bash
git checkout -b feature/expense-splitting
git checkout -b fix/budget-nan-error
git checkout -b chore/update-dependencies
```

### 2. Commit Messages

Follow conventional commits:
```
<type>(<scope>): <description>

[optional body]
```

Types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`

Examples:
```bash
git commit -m "feat(budget): add expense splitting functionality"
git commit -m "fix(itinerary): resolve timezone display issue"
git commit -m "chore(deps): update React to 19.2"
```

### 3. Pull Request Process

1. Create feature branch from `main`
2. Make changes with atomic commits
3. Run type check: `npx tsc --noEmit`
4. Create PR with clear description
5. Automated reviews run (Claude Code Review, Security Scan)
6. Address feedback
7. Squash and merge

## Coding Standards

### TypeScript

**Always use types from `types.ts`**:
```typescript
// ✅ Good
import type { Trip, Expense, Activity } from './types';

// ❌ Bad - inline types
const handleTrip = (trip: { id: string; name: string }) => {};
```

**Avoid `any`**:
```typescript
// ❌ Bad
const handleData = (data: any) => {};

// ✅ Good
const handleData = (data: Trip) => {};
const handleData = (data: unknown) => {
  if (isTrip(data)) {
    // Now TypeScript knows it's a Trip
  }
};
```

**Use strict function types**:
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

### React Components

**Component Structure Template**:
```typescript
import React from 'react';
import { IconName } from 'lucide-react';
import type { Trip } from './types';

interface ComponentProps {
  // Required props first
  trip: Trip;
  // Optional props with defaults
  showDetails?: boolean;
  // Callbacks last
  onUpdate: (trip: Trip) => void;
}

export function Component({
  trip,
  showDetails = true,
  onUpdate
}: ComponentProps) {
  // 1. Hooks at the top
  const [state, setState] = React.useState<string>('');

  // 2. Effects
  React.useEffect(() => {
    // Side effect
    return () => {
      // Cleanup
    };
  }, [dependency]);

  // 3. Memoized values
  const computedValue = React.useMemo(() => {
    return expensiveCalculation(trip);
  }, [trip]);

  // 4. Callbacks
  const handleClick = React.useCallback(() => {
    onUpdate(trip);
  }, [trip, onUpdate]);

  // 5. Render
  return (
    <div className="p-4">
      {/* JSX */}
    </div>
  );
}
```

**Performance Optimization**:
```typescript
// Memoize expensive components
export const ExpensiveList = React.memo(({ items }: Props) => {
  return items.map(item => <Item key={item.id} {...item} />);
});

// Memoize callbacks passed to children
const handleUpdate = React.useCallback((id: string) => {
  updateItem(id);
}, [updateItem]);

// Memoize expensive calculations
const total = React.useMemo(() => {
  return expenses.reduce((sum, exp) => sum + exp.amount, 0);
}, [expenses]);
```

### Styling with Tailwind

**Class Organization**:
```tsx
<button className={`
  /* Layout */
  flex items-center gap-2
  px-4 py-2

  /* Visual */
  bg-blue-500 text-white
  rounded-lg shadow-md

  /* States */
  hover:bg-blue-600 hover:shadow-lg
  focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed

  /* Transitions */
  transition-all duration-200

  /* Responsive */
  text-sm md:text-base
`}>
  Click Me
</button>
```

**Responsive Breakpoints**:
- `sm:` - 640px (mobile landscape)
- `md:` - 768px (tablet)
- `lg:` - 1024px (desktop)
- `xl:` - 1280px (large desktop)

## Testing

### Running Tests

```bash
# Type checking
npx tsc --noEmit

# Future: Unit tests (when added)
npm test

# Future: E2E tests
npm run test:e2e
```

### What to Test

1. **Budget Calculations** - Totals, percentages, edge cases
2. **Date Handling** - Formatting, validation, timezones
3. **Form Validation** - Required fields, constraints
4. **Component Rendering** - Different states, loading, errors

## Code Review

### Before Submitting PR

- [ ] Type check passes: `npx tsc --noEmit`
- [ ] No console.log statements (except errors)
- [ ] Types imported from `types.ts`
- [ ] Component follows standard structure
- [ ] Accessibility attributes included
- [ ] Mobile responsive tested

### Review Focus Areas

1. **Correctness** - Does it work as intended?
2. **Security** - Any vulnerabilities introduced?
3. **Performance** - Unnecessary re-renders?
4. **Maintainability** - Is it easy to understand and modify?

## Tools and Commands

### Slash Commands (Claude Code)

```bash
/todos              # View feature roadmap
/add-todo "..."     # Add new todo item
/code-review        # Run code review
/security-review    # Run security scan
```

### Git Commands

```bash
# Check status
git status

# View changes
git diff

# Create feature branch
git checkout -b feature/my-feature

# Commit with conventional message
git commit -m "feat(scope): description"

# Push and create PR
git push -u origin feature/my-feature
```

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Component Guide](../architecture/components.md)
- [CLAUDE.md](../../CLAUDE.md) - Full coding standards
