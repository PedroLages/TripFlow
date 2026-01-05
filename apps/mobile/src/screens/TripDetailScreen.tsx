import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import type { Trip } from '@tripflow/shared';
import { getSupabase } from '@tripflow/shared';

type RootStackParamList = {
  Dashboard: undefined;
  TripDetail: { tripId: string };
  CreateTrip: undefined;
};

type TripDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'TripDetail'>;

export function TripDetailScreen() {
  const route = useRoute<TripDetailScreenProps['route']>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    try {
      setLoading(true);
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', tripId)
        .single();

      if (error) throw error;

      setTrip(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load trip:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading trip...</Text>
      </View>
    );
  }

  if (error || !trip) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error || 'Trip not found'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image
        source={{ uri: trip.cover_image }}
        style={styles.coverImage}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <Text style={styles.title}>{trip.name}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📍 Destinations</Text>
          <Text style={styles.sectionValue}>{trip.destinations.join(', ')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📅 Dates</Text>
          <Text style={styles.sectionValue}>
            {format(new Date(trip.start_date), 'MMM d, yyyy')} - {format(new Date(trip.end_date), 'MMM d, yyyy')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🏷️ Trip Type</Text>
          <Text style={styles.sectionValue}>{trip.trip_type}</Text>
        </View>

        {trip.description && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📝 Description</Text>
            <Text style={styles.sectionValue}>{trip.description}</Text>
          </View>
        )}

        {trip.budget > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>💰 Budget</Text>
            <Text style={styles.sectionValue}>
              ${trip.budget.toLocaleString()} {trip.currency}
            </Text>
          </View>
        )}

        <View style={styles.placeholderSection}>
          <Text style={styles.placeholderText}>
            📋 Itinerary, Budget, Packing List, and Documents tabs coming soon!
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  coverImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  sectionValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  placeholderSection: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
  },
});
