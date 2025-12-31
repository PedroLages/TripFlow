
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
  homeLocation: string;
  currency: string;
  theme: 'light' | 'dark';
}
