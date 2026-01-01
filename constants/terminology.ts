/**
 * Terminology System for TripFlow
 *
 * Provides dual-language support for UI text:
 * - Tactical: Military/strategic themed language for gamified experience
 * - Standard: Traditional travel planning terminology
 *
 * Usage:
 *   import { TERMINOLOGY } from './constants/terminology';
 *   import { useTerminology } from './hooks/useTerminology';
 *
 *   const t = useTerminology();
 *   <h1>{t.trips}</h1> // "Missions" or "Trips" based on user setting
 */

export type LanguageMode = 'tactical' | 'standard';

export interface TerminologySet {
  // Core Navigation
  dashboard: string;
  trips: string;
  trip: string;
  newTrip: string;
  settings: string;

  // Trip Management
  createTrip: string;
  editTrip: string;
  deleteTrip: string;
  saveTrip: string;
  cancelTrip: string;

  // Tabs & Sections
  itinerary: string;
  budget: string;
  packing: string;
  documents: string;
  wishlist: string;
  map: string;
  overview: string;

  // Itinerary
  activities: string;
  activity: string;
  addActivity: string;
  dayPlan: string;
  timeline: string;

  // Budget
  expenses: string;
  expense: string;
  addExpense: string;
  totalSpent: string;
  remaining: string;
  budgetLimit: string;

  // Packing
  packingList: string;
  packingItem: string;
  addItem: string;
  packed: string;
  unpacked: string;

  // Documents
  travelDocuments: string;
  addDocument: string;

  // Wishlist
  wishlistPlaces: string;
  addPlace: string;

  // Status & Time
  upcoming: string;
  ongoing: string;
  completed: string;
  daysUntil: string;
  daysRemaining: string;

  // Actions
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  add: string;
  remove: string;
  view: string;

  // Misc
  recent: string;
  search: string;
  filter: string;
  sort: string;
  loading: string;
  error: string;
  success: string;
}

export const TERMINOLOGY: Record<LanguageMode, TerminologySet> = {
  tactical: {
    // Core Navigation
    dashboard: 'Command Center',
    trips: 'Missions',
    trip: 'Mission',
    newTrip: 'New Mission',
    settings: 'Operations Config',

    // Trip Management
    createTrip: 'Initiate Mission',
    editTrip: 'Modify Mission',
    deleteTrip: 'Abort Mission',
    saveTrip: 'Confirm Orders',
    cancelTrip: 'Stand Down',

    // Tabs & Sections
    itinerary: 'Battle Plan',
    budget: 'Resources',
    packing: 'Loadout',
    documents: 'Intel Files',
    wishlist: 'Recon Targets',
    map: 'Tactical Map',
    overview: 'Mission Brief',

    // Itinerary
    activities: 'Waypoints',
    activity: 'Waypoint',
    addActivity: 'Deploy Waypoint',
    dayPlan: 'Phase Plan',
    timeline: 'Operation Timeline',

    // Budget
    expenses: 'Resource Expenditures',
    expense: 'Expenditure',
    addExpense: 'Log Expenditure',
    totalSpent: 'Resources Deployed',
    remaining: 'Resources Available',
    budgetLimit: 'Resource Allocation',

    // Packing
    packingList: 'Tactical Loadout',
    packingItem: 'Gear Item',
    addItem: 'Add Gear',
    packed: 'Secured',
    unpacked: 'Pending',

    // Documents
    travelDocuments: 'Mission Intel',
    addDocument: 'File Intel',

    // Wishlist
    wishlistPlaces: 'Target Intel',
    addPlace: 'Mark Target',

    // Status & Time
    upcoming: 'Scheduled',
    ongoing: 'Active',
    completed: 'Mission Complete',
    daysUntil: 'Days to Deployment',
    daysRemaining: 'Days in Field',

    // Actions
    save: 'Confirm',
    cancel: 'Abort',
    delete: 'Eliminate',
    edit: 'Modify',
    add: 'Deploy',
    remove: 'Extract',
    view: 'Recon',

    // Misc
    recent: 'Tactical Recall',
    search: 'Scan',
    filter: 'Filter Intel',
    sort: 'Prioritize',
    loading: 'Deploying...',
    error: 'Mission Critical',
    success: 'Objective Complete',
  },

  standard: {
    // Core Navigation
    dashboard: 'Dashboard',
    trips: 'Trips',
    trip: 'Trip',
    newTrip: 'New Trip',
    settings: 'Settings',

    // Trip Management
    createTrip: 'Create Trip',
    editTrip: 'Edit Trip',
    deleteTrip: 'Delete Trip',
    saveTrip: 'Save Trip',
    cancelTrip: 'Cancel',

    // Tabs & Sections
    itinerary: 'Itinerary',
    budget: 'Budget',
    packing: 'Packing List',
    documents: 'Documents',
    wishlist: 'Wishlist',
    map: 'Map',
    overview: 'Overview',

    // Itinerary
    activities: 'Activities',
    activity: 'Activity',
    addActivity: 'Add Activity',
    dayPlan: 'Daily Plan',
    timeline: 'Timeline',

    // Budget
    expenses: 'Expenses',
    expense: 'Expense',
    addExpense: 'Add Expense',
    totalSpent: 'Total Spent',
    remaining: 'Remaining',
    budgetLimit: 'Budget Limit',

    // Packing
    packingList: 'Packing List',
    packingItem: 'Item',
    addItem: 'Add Item',
    packed: 'Packed',
    unpacked: 'Not Packed',

    // Documents
    travelDocuments: 'Travel Documents',
    addDocument: 'Add Document',

    // Wishlist
    wishlistPlaces: 'Wishlist Places',
    addPlace: 'Add Place',

    // Status & Time
    upcoming: 'Upcoming',
    ongoing: 'Ongoing',
    completed: 'Completed',
    daysUntil: 'Days Until',
    daysRemaining: 'Days Remaining',

    // Actions
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    view: 'View',

    // Misc
    recent: 'Recent',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
};

/**
 * Get terminology set for a given language mode
 */
export function getTerminology(mode: LanguageMode = 'standard'): TerminologySet {
  return TERMINOLOGY[mode];
}

/**
 * Get a specific term for a given language mode
 */
export function getTerm(key: keyof TerminologySet, mode: LanguageMode = 'standard'): string {
  return TERMINOLOGY[mode][key];
}
