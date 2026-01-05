/**
 * Shared TypeScript types for TripFlow
 * Used by both web and mobile apps
 */

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

export interface WishlistPlace {
  id: string;
  name: string;
  category: 'Must See' | 'Maybe' | 'Restaurant' | 'Shopping';
  notes: string;
  rating: number;
  location?: string;
  coordinates?: [number, number];
}

export interface PaymentHistoryEntry {
  id: string;
  amount: number;
  paidAt: string;
  notes?: string;
  method?: 'cash' | 'card' | 'transfer' | 'other';
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
  percentage?: number;
  shares?: number;
  isPaid: boolean;
  paidAt?: string;
  amountPaid?: number;
  paymentHistory?: PaymentHistoryEntry[];
}

export interface Settlement {
  id: string;
  fromUser: string;
  toUser: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed';
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface UserBalance {
  userId: string;
  owes: number;
  owed: number;
  netBalance: number;
}

export interface ReceiptImage {
  id: string;
  data: string;
  mimeType: string;
  filename: string;
  uploadedAt: string;
  size: number;
  thumbnail?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: 'Flights' | 'Accommodation' | 'Food' | 'Activities' | 'Transport' | 'Shopping' | 'Other';
  date: string;
  notes: string;
  isSplit?: boolean;
  paidBy?: string;
  splitMethod?: SplitMethod;
  splits?: ExpenseSplit[];
  currency?: string;
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
  settlements?: Settlement[];
}

export interface User {
  email: string;
  name: string;
  avatar: string;
}

export interface UserSettings {
  name: string;
  email: string;
  avatar?: string;
  homeLocation: string;
  currency: string;
  theme: 'light' | 'dark';
  languageMode?: 'tactical' | 'standard';
  sidebarCollapsed?: boolean;
}
