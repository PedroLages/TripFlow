//
//  TripService.swift
//  Network
//
//  Created on 2026-01-04
//
//  Service for fetching and managing trips from Supabase
//

import Foundation
import Supabase
import Core

/// Observable service for managing trips
@Observable
public final class TripService {
    /// Shared singleton instance
    public static let shared = TripService()

    // MARK: - Published State

    /// All user's trips
    public private(set) var trips: [Trip] = []

    /// Loading state
    public private(set) var isLoading = false

    /// Error message
    public private(set) var errorMessage: String?

    // MARK: - Private Properties

    private let supabase = SupabaseService.shared.client

    // MARK: - Initialization

    private init() {}

    // MARK: - Trip Fetching

    /// Fetch all trips for the current user
    @MainActor
    public func fetchTrips() async {
        isLoading = true
        errorMessage = nil

        do {
            let response: [Trip] = try await supabase
                .from("trips")
                .select()
                .order("start_date", ascending: false)
                .execute()
                .value

            self.trips = response
        } catch {
            errorMessage = "Failed to load trips: \(error.localizedDescription)"
            print("Error fetching trips: \(error)")
        }

        isLoading = false
    }

    /// Fetch a single trip by ID
    @MainActor
    public func fetchTrip(id: String) async -> Trip? {
        do {
            let response: Trip = try await supabase
                .from("trips")
                .select()
                .eq("id", value: id)
                .single()
                .execute()
                .value

            return response
        } catch {
            errorMessage = "Failed to load trip: \(error.localizedDescription)"
            return nil
        }
    }

    // MARK: - Trip Creation

    /// Create a new trip
    @MainActor
    public func createTrip(
        name: String,
        destination: String,
        startDate: Date,
        endDate: Date,
        description: String? = nil,
        budget: Double? = nil
    ) async throws -> Trip {
        guard let userId = try? await supabase.auth.session.user.id.uuidString else {
            throw TripServiceError.notAuthenticated
        }

        let newTrip = Trip(
            id: UUID().uuidString,
            name: name,
            destination: destination,
            startDate: startDate,
            endDate: endDate,
            description: description,
            budget: budget,
            ownerId: userId
        )

        do {
            let response: Trip = try await supabase
                .from("trips")
                .insert(newTrip)
                .select()
                .single()
                .execute()
                .value

            // Add to local array
            trips.insert(response, at: 0)

            return response
        } catch {
            errorMessage = "Failed to create trip: \(error.localizedDescription)"
            throw error
        }
    }

    // MARK: - Trip Update

    /// Update an existing trip
    @MainActor
    public func updateTrip(_ trip: Trip) async throws {
        do {
            let response: Trip = try await supabase
                .from("trips")
                .update(trip)
                .eq("id", value: trip.id)
                .select()
                .single()
                .execute()
                .value

            // Update in local array
            if let index = trips.firstIndex(where: { $0.id == trip.id }) {
                trips[index] = response
            }
        } catch {
            errorMessage = "Failed to update trip: \(error.localizedDescription)"
            throw error
        }
    }

    // MARK: - Trip Deletion

    /// Delete a trip
    @MainActor
    public func deleteTrip(id: String) async throws {
        do {
            try await supabase
                .from("trips")
                .delete()
                .eq("id", value: id)
                .execute()

            // Remove from local array
            trips.removeAll { $0.id == id }
        } catch {
            errorMessage = "Failed to delete trip: \(error.localizedDescription)"
            throw error
        }
    }
}

// MARK: - Errors

public enum TripServiceError: LocalizedError {
    case notAuthenticated

    public var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "You must be signed in to create trips"
        }
    }
}
