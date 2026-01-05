import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { Trip } from '@tripflow/shared';
import { getSupabase } from '@tripflow/shared';

type RootStackParamList = {
  Dashboard: undefined;
  TripDetail: { tripId: string };
  CreateTrip: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateTrip'>;

const TRIP_TYPES = ['Solo', 'Couple', 'Family', 'Friends', 'Business'] as const;

export function CreateTripScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    destinations: '',
    startDate: '',
    endDate: '',
    tripType: 'Solo' as typeof TRIP_TYPES[number],
    description: '',
    budget: '',
    coverImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
  });

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Trip name is required');
      return;
    }

    if (!formData.destinations.trim()) {
      Alert.alert('Validation Error', 'At least one destination is required');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      Alert.alert('Validation Error', 'Start and end dates are required');
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabase();

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a trip');
        return;
      }

      // Parse destinations (comma-separated)
      const destinationsArray = formData.destinations
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0);

      const tripData = {
        name: formData.name.trim(),
        destinations: destinationsArray,
        start_date: formData.startDate,
        end_date: formData.endDate,
        trip_type: formData.tripType,
        description: formData.description.trim(),
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        cover_image: formData.coverImage,
        currency: 'USD',
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('trips')
        .insert([tripData])
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Trip created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Dashboard');
          },
        },
      ]);
    } catch (err) {
      console.error('Failed to create trip:', err);
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to create trip'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Create New Trip</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Trip Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="e.g., Summer Europe Adventure"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Destinations * (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.destinations}
            onChangeText={(text) => setFormData({ ...formData, destinations: text })}
            placeholder="e.g., Paris, Rome, Barcelona"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.halfField]}>
            <Text style={styles.label}>Start Date *</Text>
            <TextInput
              style={styles.input}
              value={formData.startDate}
              onChangeText={(text) => setFormData({ ...formData, startDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
          </View>

          <View style={[styles.field, styles.halfField]}>
            <Text style={styles.label}>End Date *</Text>
            <TextInput
              style={styles.input}
              value={formData.endDate}
              onChangeText={(text) => setFormData({ ...formData, endDate: text })}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Trip Type</Text>
          <View style={styles.typeContainer}>
            {TRIP_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  formData.tripType === type && styles.typeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, tripType: type })}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    formData.tripType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Budget (USD)</Text>
          <TextInput
            style={styles.input}
            value={formData.budget}
            onChangeText={(text) => setFormData({ ...formData, budget: text })}
            placeholder="e.g., 5000"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Tell us about your trip..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Create Trip'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  field: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});
