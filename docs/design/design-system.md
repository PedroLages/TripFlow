# TripFlow Design System

> Design tokens, components, and patterns for TripFlow

## Design Principles

See [Design Principles](../../.claude/context/design-principles.md) for the full design philosophy.

### Core Values
1. **Clarity** - Information is easy to find and understand
2. **Delight** - Travel planning should be enjoyable
3. **Efficiency** - Common tasks are quick to complete
4. **Accessibility** - Works for everyone

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Blue 500 | `#3B82F6` | Primary actions, links |
| Blue 600 | `#2563EB` | Hover states |
| Blue 100 | `#DBEAFE` | Backgrounds, badges |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#10B981` | Confirmations, completed |
| Warning | `#F59E0B` | Alerts, budget warnings |
| Error | `#EF4444` | Errors, destructive actions |
| Info | `#3B82F6` | Information, tips |

### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| Gray 900 | `#111827` | Primary text |
| Gray 600 | `#4B5563` | Secondary text |
| Gray 400 | `#9CA3AF` | Placeholder text |
| Gray 200 | `#E5E7EB` | Borders |
| Gray 50 | `#F9FAFB` | Backgrounds |

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Scale

| Name | Class | Size |
|------|-------|------|
| Display | `text-4xl` | 36px |
| H1 | `text-3xl` | 30px |
| H2 | `text-2xl` | 24px |
| H3 | `text-xl` | 20px |
| Body | `text-base` | 16px |
| Small | `text-sm` | 14px |
| Caption | `text-xs` | 12px |

## Spacing

Using Tailwind's 4px base unit:

| Name | Class | Size |
|------|-------|------|
| xs | `p-1` | 4px |
| sm | `p-2` | 8px |
| md | `p-4` | 16px |
| lg | `p-6` | 24px |
| xl | `p-8` | 32px |

## Components

### Buttons

```tsx
// Primary
<button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-all">
  Primary Action
</button>

// Secondary
<button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all">
  Secondary
</button>

// Danger
<button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all">
  Delete
</button>

// Icon Button
<button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Edit">
  <Edit className="w-5 h-5" />
</button>
```

### Cards

```tsx
<div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6">
  <h3 className="text-xl font-semibold text-gray-900">Card Title</h3>
  <p className="text-gray-600 mt-2">Card content goes here.</p>
</div>
```

### Form Inputs

```tsx
<div>
  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
    Label
  </label>
  <input
    id="name"
    type="text"
    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    placeholder="Placeholder text"
  />
</div>
```

### Badges

```tsx
// Status badges
<span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
  Upcoming
</span>

<span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
  Ongoing
</span>

<span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
  Past
</span>
```

## Icons

Using Lucide React icons:

```tsx
import { Plane, MapPin, Calendar, DollarSign, Package, FileText, Heart, Map } from 'lucide-react';

// Standard size
<Plane className="w-5 h-5" />

// Small size
<Plane className="w-4 h-4" />

// Large size (hero)
<Plane className="w-8 h-8" />
```

## Responsive Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640-1024px | Two columns, collapsible nav |
| Desktop | > 1024px | Multi-column, sidebar nav |

```tsx
// Responsive grid example
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

## Animation

### Transitions
```css
transition-all duration-200    /* Default */
transition-colors duration-150 /* Color changes */
transition-transform duration-300 /* Movement */
```

### Hover Effects
```tsx
// Card hover
<div className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200">

// Button hover
<button className="hover:bg-blue-600 active:scale-95 transition-all">
```

## Related Documentation

- [Design Principles](../../.claude/context/design-principles.md)
- [Component Architecture](../architecture/components.md)
