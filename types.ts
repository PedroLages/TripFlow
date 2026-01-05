
export type TripType = 'Solo' | 'Couple' | 'Family' | 'Friends' | 'Business';
export type UserRole = 'Editor' | 'Viewer';

export type ActivityType =
  | 'Attraction'
  | 'Restaurant'
  | 'Transportation'
  | 'Accommodation'
  | 'Tour'
  | 'Free time'
  | 'Custom';

export type TransportMode = 'walking' | 'driving' | 'cycling' | 'transit';

export type SplitMethod = 'equal' | 'custom' | 'percentage' | 'shares';

export interface Activity {
  id: string;
  type: ActivityType;
  name: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
  cost: number;
  iconName?: string;
}

export interface DayPlan {
  id: string;
  date: string;
  activities: Activity[];
}

/**
 * Route segment connecting two consecutive activities
 * Used for map visualization of travel routes
 */
export interface RouteSegment {
  id: string;                    // Unique ID: `${fromId}-${toId}`
  fromActivity: Activity;
  toActivity: Activity;
  fromCoords: [number, number];  // [lat, lng]
  toCoords: [number, number];    // [lat, lng]
  day: number;                   // Day number (1-indexed)
  distance: number;              // Distance in meters
  geometry: GeoJSON.LineString;  // GeoJSON for MapLibre
  mode: TransportMode;           // Transport mode for this segment
  duration?: number;             // Travel duration in seconds (from routing API)
}

export interface WishlistPlace {
  id: string;
  name: string;
  category: 'Must See' | 'Maybe' | 'Restaurant' | 'Shopping';
  notes: string;
  rating: number; // Priority: 1-5

  // Location data
  location?: string;              // Address or place name
  coordinates?: [number, number]; // [lat, lng]

  // Visual & pricing
  imageUrl?: string;              // Photo URL
  priceRange?: 1 | 2 | 3 | 4;    // $ to $$$$

  // Operating information
  hours?: string;                 // e.g., "9:00 AM - 6:00 PM"
  bestTimeToVisit?: string;       // e.g., "Morning to avoid crowds"

  // Status tracking
  visited?: boolean;              // Marked as completed
  createdAt?: string;             // ISO timestamp when added
}

export interface PaymentHistoryEntry {
  id: string;
  amount: number;
  paidAt: string;          // ISO timestamp
  notes?: string;
  method?: 'cash' | 'card' | 'transfer' | 'other';
}

export interface ExpenseSplit {
  userId: string;          // Matches Collaborator.email
  amount: number;
  percentage?: number;     // For percentage splits (0-100)
  shares?: number;         // For share-based splits
  isPaid: boolean;         // Full settlement status
  paidAt?: string;         // ISO timestamp when fully settled
  amountPaid?: number;     // Partial payment tracking (0 to amount)
  paymentHistory?: PaymentHistoryEntry[];  // Record of all payments
}

export interface Settlement {
  id: string;
  fromUser: string;        // Who owes (email)
  toUser: string;          // Who is owed (email)
  amount: number;
  currency: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface UserBalance {
  userId: string;
  owes: number;            // Total amount this user owes
  owed: number;            // Total amount this user is owed
  netBalance: number;      // Positive = owed money, Negative = owes money
}

export interface ReceiptImage {
  id: string;
  data: string;              // Base64 encoded image data
  mimeType: string;          // e.g., 'image/jpeg', 'image/png'
  filename: string;
  uploadedAt: string;        // ISO timestamp
  size: number;              // File size in bytes
  thumbnail?: string;        // Optional thumbnail (base64)
}

export interface Expense {
  id: string;
  amount: number;
  category: 'Flights' | 'Accommodation' | 'Food' | 'Activities' | 'Transport' | 'Shopping' | 'Other';
  date: string;
  notes: string;

  // Split expense fields (all optional for backward compatibility)
  isSplit?: boolean;
  paidBy?: string;          // User email who paid
  splitMethod?: SplitMethod;
  splits?: ExpenseSplit[];
  currency?: string;         // Defaults to trip currency if not specified

  // Receipt image storage
  receiptImages?: ReceiptImage[];
}

export interface PackingItem {
  id: string;
  name: string;
  category: string;
  isPacked: boolean;
}

export interface TravelDocument {
  id: string;
  type: 'Flight' | 'Hotel' | 'Car' | 'Insurance' | 'Contact';
  title: string;
  details: string;
  confirmation: string;
  price?: number;
  date?: string;
  status?: string; 
  gate?: string;
  lastUpdated?: string;
}

export interface TravelAlert {
  id: string;
  type: 'Flight' | 'Event' | 'Strike' | 'Weather';
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  date: string;
}

export interface Collaborator {
  email: string;
  role: UserRole;
  avatar: string;
  isOwner?: boolean;
}

export interface ActivityLog {
  id: string;
  userEmail: string;
  action: string;
  timestamp: string;
}

export interface Trip {
  id: string;
  name: string;
  destinations: string[];
  startDate: string;
  endDate: string;
  type: TripType;
  coverImage: string;
  description: string;
  budget: number;
  itinerary: DayPlan[];
  wishlist: WishlistPlace[];
  expenses: Expense[];
  packingList: PackingItem[];
  documents: TravelDocument[];
  collaborators: Collaborator[];
  alerts: TravelAlert[];
  activityLogs: ActivityLog[];
  ownerEmail: string;
  isPast?: boolean;
  currentUserRole?: UserRole;
  settlements?: Settlement[];   // Calculated settlements for split expenses
}

export interface User {
  email: string;
  name: string;
  avatar: string;
}

export interface UserSettings {
  name: string;
  email: string;
  avatar?: string; // Google OAuth avatar URL
  homeLocation: string;
  currency: string;
  theme: 'light' | 'dark';
  languageMode?: 'tactical' | 'standard'; // UI terminology preference
  sidebarCollapsed?: boolean; // Sidebar collapse state (synced across devices)
}
