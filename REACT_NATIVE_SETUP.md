# React Native Setup Guide for TripFlow

## Overview
This guide will help you set up a React Native mobile app alongside your existing web app, sharing code between both platforms.

## Prerequisites
- Node.js 18+ installed
- npm 9+ installed
- Xcode (for iOS development)
- Android Studio (for Android development)
- Expo CLI: `npm install -g expo-cli`

## Step 1: Reorganize Project Structure

### 1.1 Backup your current project
```bash
cd /Volumes/SSD/Dev/TripFlow
cp -r . ../TripFlow-backup
```

### 1.2 Create new directory structure
```bash
# Create apps and packages directories
mkdir -p apps/web apps/mobile packages/shared/{api,types,hooks,utils}

# Move existing web app to apps/web
mv components src index.html vite.config.ts tsconfig.json tailwind.config.js postcss.config.js apps/web/
mv package.json apps/web/package.json.backup

# Note: Keep supabase/ in root (shared by all apps)
```

### 1.3 Replace root package.json
```bash
# The new root package.json is already created at package.json.new
mv package.json.new package.json
```

## Step 2: Initialize React Native with Expo

```bash
cd apps
npx create-expo-app mobile --template blank-typescript

cd mobile
```

## Step 3: Install React Native Dependencies

```bash
cd /Volumes/SSD/Dev/TripFlow/apps/mobile

# Navigation
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# Supabase (React Native compatible)
npm install @supabase/supabase-js
npx expo install @react-native-async-storage/async-storage react-native-url-polyfill

# Date utilities (same as web!)
npm install date-fns

# Icons (React Native version)
npm install lucide-react-native

# UI components (optional - Material Design)
npm install react-native-paper

# Link shared package
npm install @tripflow/shared@file:../../packages/shared
```

## Step 4: Configure Shared Package

The shared package is already set up with:
- ✅ `packages/shared/types/` - TypeScript types
- ✅ `packages/shared/api/supabase.ts` - Supabase client
- ✅ `packages/shared/package.json` - Package configuration

### 4.1 Create shared package index
```bash
cd /Volumes/SSD/Dev/TripFlow/packages/shared
```

Create `index.ts`:
```typescript
// Types
export * from './types';

// API
export { initializeSupabase, getSupabase, isSupabaseReady } from './api/supabase';
export type { SupabaseConfig } from './api/supabase';
```

## Step 5: Set up Environment Variables

### 5.1 Mobile app (.env)
```bash
cd /Volumes/SSD/Dev/TripFlow/apps/mobile
```

Create `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xnmbvjlhwrukliuzhhvf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubWJ2amxod3J1a2xpdXpoaHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTA0NjUsImV4cCI6MjA4Mjc4NjQ2NX0.gF6g_CBzJgn9pKWhgoL63yWD_wljCjFW32B7fEAx3bg
```

### 5.2 Install dotenv
```bash
npm install dotenv
npx expo install expo-constants
```

## Step 6: Initialize Supabase in Mobile App

Edit `apps/mobile/App.tsx`:
```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeSupabase } from '@tripflow/shared';
import Constants from 'expo-constants';

// Initialize Supabase with AsyncStorage (React Native)
initializeSupabase({
  url: Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL!,
  anonKey: Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  storage: AsyncStorage,
});

// Rest of your app...
```

## Step 7: Create Basic Navigation Structure

Create `apps/mobile/src/navigation/AppNavigator.tsx`:
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens (to be created)
import DashboardScreen from '../screens/DashboardScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import CreateTripScreen from '../screens/CreateTripScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  TripDetail: { tripId: string };
  CreateTrip: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Dashboard">
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'My Trips' }}
        />
        <Stack.Screen
          name="TripDetail"
          component={TripDetailScreen}
          options={{ title: 'Trip Details' }}
        />
        <Stack.Screen
          name="CreateTrip"
          component={CreateTripScreen}
          options={{ title: 'Create Trip', presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Step 8: Create Basic Screens

### 8.1 Dashboard Screen
Create `apps/mobile/src/screens/DashboardScreen.tsx`:
```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getSupabase, Trip } from '@tripflow/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTrip = ({ item }: { item: Trip }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
    >
      <Text style={styles.tripName}>{item.name}</Text>
      <Text style={styles.tripDestination}>
        {item.destinations.join(', ')}
      </Text>
      <Text style={styles.tripDates}>
        {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Loading trips...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text>No trips yet</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateTrip')}
            >
              <Text style={styles.createButtonText}>Create Your First Trip</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateTrip')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tripCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tripName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tripDestination: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  tripDates: {
    fontSize: 14,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
  },
  createButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## Step 9: Run the App

### 9.1 Install dependencies
```bash
cd /Volumes/SSD/Dev/TripFlow
npm install
```

### 9.2 Start the mobile app
```bash
npm run mobile
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- Scan QR code with Expo Go app for physical device

### 9.3 Start the web app (in another terminal)
```bash
npm run web
```

## Project Structure After Setup

```
TripFlow/
├── apps/
│   ├── web/                     # React web app
│   │   ├── components/
│   │   ├── src/
│   │   ├── index.html
│   │   └── package.json
│   ├── mobile/                  # React Native app
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   └── navigation/
│   │   ├── App.tsx
│   │   ├── app.json
│   │   └── package.json
│   └── ios/                     # Native iOS (SwiftUI)
│       └── TripFlow/
├── packages/
│   └── shared/                  # Shared code
│       ├── api/                # Supabase client
│       ├── types/              # TypeScript types
│       ├── hooks/              # React hooks (future)
│       ├── utils/              # Utilities (future)
│       ├── index.ts
│       └── package.json
├── supabase/                    # Shared backend
│   ├── migrations/
│   └── functions/
├── package.json                 # Root workspace config
└── REACT_NATIVE_SETUP.md       # This file
```

## Next Steps

1. **Extract shared hooks** from web app (useAuth, useTrips, etc.)
2. **Create CreateTrip screen** for mobile
3. **Create TripDetail screen** for mobile
4. **Add authentication flow**
5. **Style with your design system**
6. **Add offline support** with React Query
7. **Test on both platforms**

## Troubleshooting

### Metro bundler issues
```bash
cd apps/mobile
npx expo start --clear
```

### Module resolution errors
```bash
cd /Volumes/SSD/Dev/TripFlow
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
```

### AsyncStorage errors
```bash
cd apps/mobile
npx expo install @react-native-async-storage/async-storage
```

## Benefits of This Setup

- ✅ **Code Sharing**: Types, API calls, and hooks shared between web and mobile
- ✅ **Type Safety**: Full TypeScript support across all apps
- ✅ **Single Backend**: One Supabase instance for all platforms
- ✅ **Monorepo**: Easy to manage dependencies and versions
- ✅ **Fast Development**: Hot reload on both web and mobile
- ✅ **Native Features**: Can add platform-specific code when needed

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
