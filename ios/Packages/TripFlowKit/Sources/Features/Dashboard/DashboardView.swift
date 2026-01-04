//
//  DashboardView.swift
//  Features
//
//  Created on 2026-01-04
//
//  Main dashboard showing user's trips
//

import SwiftUI
import DesignSystem
import Network
import Core

public struct DashboardView: View {
    @Environment(AuthService.self) private var auth
    @Environment(TripService.self) private var tripService

    @State private var showingCreateTrip = false

    public init() {}

    public var body: some View {
        NavigationStack {
            ZStack {
                // Background
                Color.slate50.ignoresSafeArea()

                if tripService.trips.isEmpty && !tripService.isLoading {
                    // Empty state
                    EmptyStateView(showingCreateTrip: $showingCreateTrip)
                } else {
                    // Trip list
                    ScrollView {
                        VStack(spacing: Spacing.md) {
                            ForEach(tripService.trips) { trip in
                                TripCardView(trip: trip)
                            }
                        }
                        .padding(Spacing.screenPadding)
                    }
                }
            }
            .navigationTitle("My Trips")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    // User menu
                    Menu {
                        Text(auth.user?.email ?? "User")
                            .font(.caption)

                        Divider()

                        Button(role: .destructive) {
                            Task {
                                await auth.signOut()
                            }
                        } label: {
                            Label("Sign Out", systemImage: "arrow.right.square")
                        }
                    } label: {
                        Image(systemName: "person.circle.fill")
                            .font(.title2)
                            .foregroundColor(.brandPrimary)
                    }
                }

                ToolbarItem(placement: .topBarTrailing) {
                    // Add trip button
                    Button {
                        showingCreateTrip = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundColor(.brandPrimary)
                    }
                }
            }
            .refreshable {
                await tripService.fetchTrips()
            }
            .task {
                if tripService.trips.isEmpty {
                    await tripService.fetchTrips()
                }
            }
            .sheet(isPresented: $showingCreateTrip) {
                CreateTripView()
            }
        }
    }
}

// MARK: - Trip Card

struct TripCardView: View {
    let trip: Trip

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.md) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: Spacing.xs) {
                    Text(trip.name)
                        .font(.heading3)
                        .foregroundColor(.slate900)

                    HStack(spacing: Spacing.xs) {
                        Image(systemName: "mappin.circle.fill")
                            .font(.caption)
                            .foregroundColor(.slate500)

                        Text(trip.destination)
                            .font(.bodySmall)
                            .foregroundColor(.slate600)
                    }
                }

                Spacer()

                // Status badge
                Text(trip.status.displayName)
                    .badge(color: badgeColor(for: trip.status))
            }

            // Dates
            HStack {
                Image(systemName: "calendar")
                    .font(.caption)
                    .foregroundColor(.slate500)

                Text(trip.dateRangeFormatted)
                    .font(.bodySmall)
                    .foregroundColor(.slate600)

                Spacer()

                Text("\(trip.durationDays) days")
                    .font(.caption)
                    .foregroundColor(.slate500)
            }

            // Budget (if available)
            if let budget = trip.budget {
                HStack {
                    Image(systemName: "dollarsign.circle")
                        .font(.caption)
                        .foregroundColor(.slate500)

                    Text(formatCurrency(budget))
                        .font(.bodySmall)
                        .foregroundColor(.slate600)

                    Spacer()
                }
            }

            // Days until
            if trip.status == .upcoming && trip.daysUntil > 0 {
                HStack {
                    Image(systemName: "hourglass")
                        .font(.caption)
                        .foregroundColor(.brandPrimary)

                    Text("\(trip.daysUntil) days until departure")
                        .font(.caption)
                        .foregroundColor(.brandPrimary)

                    Spacer()
                }
            }
        }
        .tripCard()
    }

    private func badgeColor(for status: TripStatus) -> Color {
        switch status {
        case .upcoming: return .blue500
        case .ongoing: return .brandSuccess
        case .past: return .slate400
        }
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$\(amount)"
    }
}

// MARK: - Empty State

struct EmptyStateView: View {
    @Binding var showingCreateTrip: Bool

    var body: some View {
        VStack(spacing: Spacing.xl) {
            Image(systemName: "airplane.departure")
                .font(.system(size: 64))
                .foregroundStyle(
                    LinearGradient(
                        colors: [.brandPrimary, .blue500],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            VStack(spacing: Spacing.sm) {
                Text("No trips yet")
                    .font(.heading2)
                    .foregroundColor(.slate900)

                Text("Create your first trip to start planning your adventure")
                    .font(.bodySmall)
                    .foregroundColor(.slate600)
                    .multilineTextAlignment(.center)
            }

            Button {
                showingCreateTrip = true
            } label: {
                Text("Create Your First Trip")
                    .primaryButton()
            }
            .padding(.horizontal, Spacing.screenPadding)
        }
        .padding(Spacing.xl)
    }
}

#Preview {
    DashboardView()
        .environment(AuthService.shared)
        .environment(TripService.shared)
}
