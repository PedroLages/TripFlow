# 🧳 TripFlow - Smart Trip Planning Application

![Claude Code Review](https://github.com/PedroLages/TripFlow/workflows/Claude%20Code%20Review/badge.svg)
![Security Review](https://github.com/PedroLages/TripFlow/workflows/Security%20Review/badge.svg)

**TripFlow** is a comprehensive trip planning application built with React and TypeScript. Organize your trips, manage itineraries, track budgets, create packing lists, and collaborate with travel companions—all in one intuitive interface.

## ✨ Key Features

- **Trip Dashboard**: Visual overview of all your trips with status tracking (upcoming, ongoing, past)
- **Detailed Itinerary Planning**: Day-by-day activity planning with time slots, locations, and cost tracking
- **Budget Management**: Track expenses across categories with visual breakdowns and budget alerts
- **Smart Packing Lists**: Organize items by category with pack/unpack tracking
- **Document Storage**: Keep all your travel documents (flights, hotels, insurance) in one place
- **Wishlist & Planning**: Save places you want to visit and integrate them into your itinerary
- **Interactive Map View**: Visualize your trip destinations and activities
- **Collaborative Planning**: Share trips with travel companions and manage permissions

## 🛠️ Tech Stack

- **Framework**: React 19.2 with TypeScript 5.8
- **Build Tool**: Vite 6.2
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts for budget visualization
- **Date Handling**: date-fns
- **AI Integration**: Google Gemini API (@google/genai)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Google Gemini API key (optional, for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/PedroLages/TripFlow.git
cd TripFlow

# Install dependencies
npm install

# Set up environment variables (optional)
# Create a .env file in the root directory
echo "VITE_GEMINI_API_KEY=your_api_key_here" > .env

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## 📱 Responsive Design

TripFlow is fully responsive and optimized for:

- **Desktop** (1024px+): Full sidebar navigation and multi-column layouts
- **Tablet** (640px-1024px): Adaptive layouts with collapsible navigation
- **Mobile** (< 640px): Touch-optimized interface with bottom navigation

## 🤖 Automated Code Quality

This project includes automated workflows powered by Claude Code:

- **Code Review**: Automated PR reviews for architecture, security, and performance
- **Security Scanning**: High-confidence vulnerability detection on every PR
- **Design Validation**: Comprehensive UI/UX review with Playwright testing

See [CLAUDE.md](./CLAUDE.md) for coding standards and conventions.

## 📖 Documentation

- [CLAUDE.md](./CLAUDE.md) - Comprehensive coding standards and project conventions
- [Design Principles](./.claude/context/design-principles.md) - UI/UX guidelines and design system
- [Code Review Guide](./.claude/skills/code-review.md) - Pragmatic code review framework
- [Security Guidelines](./.claude/skills/security-review.md) - Security best practices

## 🏗️ Project Structure

```text
TripFlow/
├── components/              # React components
│   ├── Dashboard.tsx       # Main dashboard with trip cards
│   ├── TripDetail.tsx      # Individual trip view
│   ├── TripForm.tsx        # Trip creation/editing
│   ├── Sidebar.tsx         # Desktop navigation
│   ├── MobileNav.tsx       # Mobile navigation
│   ├── Settings.tsx        # User settings
│   └── tabs/               # Trip detail tabs
│       ├── ItineraryTab.tsx
│       ├── BudgetTab.tsx
│       ├── PackingTab.tsx
│       ├── DocumentsTab.tsx
│       ├── WishlistTab.tsx
│       └── MapTab.tsx
├── types.ts                # TypeScript type definitions
├── data.ts                 # Sample data and state
├── App.tsx                 # Main app component
├── index.tsx               # Application entry point
└── vite.config.ts          # Vite configuration
```

## 🎨 Key Components

### Trip Dashboard

The main view displaying all trips as cards with:

- Visual status indicators (upcoming, ongoing, past)
- Quick stats (days remaining, budget status)
- Activity summaries and next actions
- Search and filter capabilities

### Trip Detail View

Tabbed interface for managing trip details:

- **Itinerary**: Day-by-day activity planning
- **Budget**: Expense tracking with category breakdowns
- **Packing**: Checklist organization by category
- **Documents**: Travel document storage and tracking
- **Wishlist**: Places to visit and explore
- **Map**: Visual overview of destinations

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Code Quality Tools

```bash
# Type checking
npx tsc --noEmit

# Manual code review (requires Claude Code CLI)
# /code-review

# Security scan
# /security-review
```

## 🌟 Features in Development

- Real-time collaboration with WebSocket support
- Offline mode with service workers
- Calendar integration (Google Calendar, iCal)
- Currency conversion with live rates
- Weather forecasts for destinations
- Flight and hotel booking integrations

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a personal project. For bug reports or feature requests, please open an issue.

---

**Built with** ❤️ **and** 🤖 **[Claude Code](https://claude.com/claude-code)**
