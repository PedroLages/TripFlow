# Getting Started with TripFlow

> Quick guide to set up your TripFlow development environment

## Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- **VS Code** (recommended) with extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Vue Plugin (Volar) for better TS support

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/PedroLages/TripFlow.git
cd TripFlow

# Install dependencies
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Optional: For AI-powered features
VITE_GEMINI_API_KEY=your_api_key_here
```

> **Note**: The Gemini API key is optional. The app works without it, but AI features will be disabled.

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Verify Setup

You should see:
- Dashboard with sample trips
- Responsive navigation (sidebar on desktop, bottom nav on mobile)
- Trip cards with status indicators

## Project Structure Overview

```
TripFlow/
├── components/          # React components
│   ├── Dashboard.tsx   # Main trip list view
│   ├── TripDetail.tsx  # Individual trip view
│   ├── TripForm.tsx    # Trip creation/editing
│   └── tabs/           # Trip detail tabs
├── types.ts            # TypeScript type definitions
├── data.ts             # Sample data and initial state
├── App.tsx             # Main app with routing
└── index.tsx           # Entry point
```

## Common Development Tasks

### Create a New Component

```bash
# Components go in the components/ directory
touch components/MyComponent.tsx
```

Follow this structure:
```typescript
import React from 'react';
import type { Trip } from './types';

interface MyComponentProps {
  trip: Trip;
  onAction: () => void;
}

export function MyComponent({ trip, onAction }: MyComponentProps) {
  return (
    <div className="p-4">
      {/* Component content */}
    </div>
  );
}
```

### Add a New Trip Tab

1. Create the tab component in `components/tabs/`
2. Import it in `TripDetail.tsx`
3. Add to the tabs array with icon and label
4. Update the tab content rendering

### Modify Types

All TypeScript types are in `types.ts`. When adding new features:
1. Add/modify interfaces in `types.ts`
2. Update `Trip` interface if adding trip-level data
3. Update sample data in `data.ts`

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npx tsc --noEmit # Type check without building
```

## Next Steps

- Read the [Development Guide](development.md) for coding standards
- Check [Architecture Overview](../architecture/overview.md) for system design
- Review [CLAUDE.md](../../CLAUDE.md) for project conventions

## Troubleshooting

### "vite: command not found"
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors on fresh clone
```bash
npx tsc --noEmit
# Review and fix type errors
```

### Port 5173 already in use
```bash
# Kill existing process or use different port
npm run dev -- --port 3000
```
