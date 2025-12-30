
import { Trip, TripType, Collaborator } from './types';
import { addDays, format } from 'date-fns';

const today = new Date();

const SAMPLE_COLLABORATORS: Collaborator[] = [
  { email: 'alex@tripflow.ai', role: 'Editor', avatar: 'https://i.pravatar.cc/150?u=alex', isOwner: true },
  { email: 'sam@tripflow.ai', role: 'Viewer', avatar: 'https://i.pravatar.cc/150?u=sam' },
  { email: 'jordan@tripflow.ai', role: 'Editor', avatar: 'https://i.pravatar.cc/150?u=jordan' },
  { email: 'mia@tripflow.ai', role: 'Editor', avatar: 'https://i.pravatar.cc/150?u=mia' }
];

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'tokyo-2025-mega',
    name: 'Ultimate Tokyo & Kyoto 2025',
    destinations: ['Tokyo', 'Hakone', 'Kyoto'],
    startDate: format(addDays(today, 14), 'yyyy-MM-dd'),
    endDate: format(addDays(today, 24), 'yyyy-MM-dd'),
    type: 'Friends' as TripType,
    coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=1200',
    description: 'A deep dive into the neon lights of Tokyo and the ancient traditions of Kyoto. Includes a relaxing stop at a ryokan in Hakone.',
    budget: 5000,
    currentUserRole: 'Editor',
    ownerEmail: 'demo@tripflow.ai',
    activityLogs: [
      { id: 'log-1', userEmail: 'demo@tripflow.ai', action: 'Created trip', timestamp: new Date().toISOString() },
      { id: 'log-2', userEmail: 'alex@tripflow.ai', action: 'Added TeamLab Borderless to wishlist', timestamp: new Date().toISOString() }
    ],
    itinerary: [
      {
        id: 'day-1',
        date: format(addDays(today, 14), 'yyyy-MM-dd'),
        activities: [
          {
            id: 'act-1',
            type: 'Transportation',
            name: 'Flight NH11 Arrival',
            startTime: '14:30',
            endTime: '15:30',
            location: 'Narita International Airport',
            notes: 'Pick up JR Pass and Suica card at Terminal 1.',
            cost: 0,
            iconName: 'Plane'
          },
          {
            id: 'act-2',
            type: 'Accommodation',
            name: 'Hotel Check-in',
            startTime: '17:00',
            endTime: '17:30',
            location: 'Park Hotel Tokyo, Shiodome',
            notes: 'Request a room with a view of Tokyo Tower.',
            cost: 0,
            iconName: 'Bed'
          },
          {
            id: 'act-3',
            type: 'Restaurant',
            name: 'Shimbashi Yakitori Alley',
            startTime: '19:30',
            endTime: '21:30',
            location: 'Shimbashi Under-the-Tracks',
            notes: 'Classic salaryman dinner spot. Great atmosphere.',
            cost: 40,
            iconName: 'Beer'
          }
        ]
      },
      {
        id: 'day-2',
        date: format(addDays(today, 15), 'yyyy-MM-dd'),
        activities: [
          {
            id: 'act-4',
            type: 'Attraction',
            name: 'Tsukiji Outer Market',
            startTime: '08:00',
            endTime: '10:30',
            location: 'Tsukiji, Chuo City',
            notes: 'Try the fresh uni and tamagoyaki on a stick.',
            cost: 30,
            iconName: 'Utensils'
          },
          {
            id: 'act-5',
            type: 'Attraction',
            name: 'TeamLab Borderless',
            startTime: '11:30',
            endTime: '14:30',
            location: 'Azabudai Hills',
            notes: 'Booked tickets for 11:30 slot.',
            cost: 35,
            iconName: 'Camera'
          },
          {
            id: 'act-6',
            type: 'Attraction',
            name: 'Shibuya Crossing & Hachiko',
            startTime: '16:00',
            endTime: '18:00',
            location: 'Shibuya Station',
            notes: 'Watch the scramble from the Starbucks upstairs.',
            cost: 0,
            iconName: 'Footprints'
          }
        ]
      }
    ],
    wishlist: [
      { id: 'w-1', name: 'Shibuya Sky', category: 'Must See', notes: 'Sunset view is a must-book.', rating: 5 },
      { id: 'w-2', name: 'Ghibli Museum', category: 'Maybe', notes: 'Tickets are hard to get. Need to book exactly 1 month before.', rating: 5 },
      { id: 'w-3', name: 'Ichiran Shinjuku', category: 'Restaurant', notes: 'Classic solo booth ramen.', rating: 4 },
      { id: 'w-4', name: 'Don Quijote Ginza', category: 'Shopping', notes: 'For all the weird Japanese snacks.', rating: 5 }
    ],
    expenses: [
      { id: 'exp-1', amount: 1150, category: 'Flights', date: format(today, 'yyyy-MM-dd'), notes: 'ANA Round Trip from SFO' },
      { id: 'exp-2', amount: 1400, category: 'Accommodation', date: format(today, 'yyyy-MM-dd'), notes: '7 Nights at Park Hotel' },
      { id: 'exp-3', amount: 350, category: 'Transport', date: format(today, 'yyyy-MM-dd'), notes: 'JR Pass 7-Day' }
    ],
    packingList: [
      { id: 'p-1', name: 'Passport', category: 'Documents', isPacked: true },
      { id: 'p-2', name: 'Universal Power Adapter', category: 'Electronics', isPacked: true },
      { id: 'p-3', name: 'Walking Shoes', category: 'Shoes', isPacked: false },
      { id: 'p-4', name: 'Suica/Pasmo Card', category: 'Documents', isPacked: false },
      { id: 'p-5', name: 'Portable Wi-Fi / eSIM', category: 'Electronics', isPacked: false }
    ],
    documents: [
      { id: 'd-1', type: 'Flight', title: 'ANA Flight NH11', details: 'SFO -> NRT, Seat 22A', confirmation: 'NH11-XJ9', status: 'On Time', lastUpdated: new Date().toISOString() },
      { id: 'd-2', type: 'Hotel', title: 'Park Hotel Tokyo', details: 'Check-in: 3:00 PM', confirmation: 'BK-99212', lastUpdated: new Date().toISOString() }
    ],
    collaborators: SAMPLE_COLLABORATORS,
    alerts: [
      { id: 'alt-1', type: 'Event', title: 'Cherry Blossom Peak', description: 'Forecasts suggest peak bloom will coincide with your visit.', severity: 'Low', date: format(today, 'yyyy-MM-dd') }
    ]
  }
];

export const PACKING_CATEGORIES = [
  'Clothing', 
  'Shoes',
  'Toiletries', 
  'Electronics', 
  'Documents', 
  'Medications', 
  'Accessories',
  'Emergency Gear',
  'Miscellaneous'
];
