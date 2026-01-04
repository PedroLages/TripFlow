//
//  TripDetailView.swift
//  Features
//
//  Created on 2026-01-04
//
//  Detailed trip view with tabs for different sections
//

import SwiftUI
import Core
import DesignSystem
import Network

public struct TripDetailView: View {
    let trip: Trip

    @Environment(\.dismiss) private var dismiss
    @Environment(TripService.self) private var tripService

    @State private var selectedTab: TripTab = .overview

    public init(trip: Trip) {
        self.trip = trip
    }

    public var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Tab picker
                Picker("Tab", selection: $selectedTab) {
                    ForEach(TripTab.allCases) { tab in
                        Text(tab.title).tag(tab)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                // Tab content
                TabView(selection: $selectedTab) {
                    OverviewTab(trip: trip)
                        .tag(TripTab.overview)

                    ItineraryTab(trip: trip)
                        .tag(TripTab.itinerary)

                    BudgetTab(trip: trip)
                        .tag(TripTab.budget)

                    AccommodationsTab(trip: trip)
                        .tag(TripTab.accommodations)

                    PackingTab(trip: trip)
                        .tag(TripTab.packing)

                    DocumentsTab(trip: trip)
                        .tag(TripTab.documents)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
            }
            .navigationTitle(trip.name)
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        // TODO: Edit trip
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .font(.title2)
                            .foregroundColor(.brandPrimary)
                    }
                }
            }
        }
    }
}

// MARK: - Tab Enum

enum TripTab: String, CaseIterable, Identifiable {
    case overview
    case itinerary
    case budget
    case accommodations
    case packing
    case documents

    var id: String { rawValue }

    var title: String {
        switch self {
        case .overview: return "Overview"
        case .itinerary: return "Itinerary"
        case .budget: return "Budget"
        case .accommodations: return "Stay"
        case .packing: return "Packing"
        case .documents: return "Docs"
        }
    }

    var icon: String {
        switch self {
        case .overview: return "info.circle"
        case .itinerary: return "calendar"
        case .budget: return "dollarsign.circle"
        case .accommodations: return "bed.double"
        case .packing: return "bag"
        case .documents: return "doc.text"
        }
    }
}

// MARK: - Overview Tab

struct OverviewTab: View {
    let trip: Trip

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.lg) {
                // Trip header with image
                if let imageUrl = trip.imageUrl {
                    AsyncImage(url: URL(string: imageUrl)) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Rectangle()
                            .fill(LinearGradient(
                                colors: [.brandPrimary, .blue500],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ))
                    }
                    .frame(height: 200)
                    .clipped()
                    .cornerRadius(BorderRadius.card)
                }

                // Basic info
                VStack(alignment: .leading, spacing: Spacing.md) {
                    InfoRow(
                        icon: "mappin.circle.fill",
                        label: "Destination",
                        value: trip.destination
                    )

                    InfoRow(
                        icon: "calendar",
                        label: "Dates",
                        value: trip.dateRangeFormatted
                    )

                    InfoRow(
                        icon: "clock",
                        label: "Duration",
                        value: "\(trip.durationDays) days"
                    )

                    if let budget = trip.budget {
                        InfoRow(
                            icon: "dollarsign.circle",
                            label: "Budget",
                            value: formatCurrency(budget)
                        )
                    }
                }

                // Description
                if let description = trip.description, !description.isEmpty {
                    VStack(alignment: .leading, spacing: Spacing.sm) {
                        Text("About")
                            .font(.heading3)
                            .foregroundColor(.slate900)

                        Text(description)
                            .font(.body)
                            .foregroundColor(.slate600)
                    }
                }

                // Status badge
                HStack {
                    Spacer()
                    Text(trip.status.displayName)
                        .badge(color: badgeColor(for: trip.status))
                    Spacer()
                }
            }
            .padding(Spacing.screenPadding)
        }
        .background(Color.slate50)
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

// MARK: - Info Row Component

struct InfoRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: Spacing.md) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.brandPrimary)
                .frame(width: 32)

            VStack(alignment: .leading, spacing: 4) {
                Text(label)
                    .font(.captionMedium)
                    .foregroundColor(.slate500)

                Text(value)
                    .font(.body)
                    .foregroundColor(.slate900)
            }

            Spacer()
        }
        .padding(Spacing.md)
        .background(Color.white)
        .cornerRadius(BorderRadius.xl)
    }
}

// MARK: - Badge Modifier

extension Text {
    func badge(color: Color) -> some View {
        self
            .font(.captionMedium)
            .foregroundColor(.white)
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.xs)
            .background(color)
            .cornerRadius(BorderRadius.badge)
    }
}

// MARK: - Placeholder Tabs

struct ItineraryTab: View {
    let trip: Trip

    var body: some View {
        PlaceholderTabView(
            icon: "calendar",
            title: "Itinerary",
            message: "Plan your daily activities and schedule"
        )
    }
}

struct BudgetTab: View {
    let trip: Trip

    var body: some View {
        PlaceholderTabView(
            icon: "dollarsign.circle",
            title: "Budget Tracker",
            message: "Track expenses and manage your budget"
        )
    }
}

struct AccommodationsTab: View {
    let trip: Trip

    var body: some View {
        PlaceholderTabView(
            icon: "bed.double",
            title: "Accommodations",
            message: "Manage hotels and places to stay"
        )
    }
}

struct PackingTab: View {
    let trip: Trip

    var body: some View {
        PlaceholderTabView(
            icon: "bag",
            title: "Packing List",
            message: "Keep track of what to pack"
        )
    }
}

struct DocumentsTab: View {
    let trip: Trip

    var body: some View {
        PlaceholderTabView(
            icon: "doc.text",
            title: "Documents",
            message: "Store tickets, reservations, and important documents"
        )
    }
}

struct PlaceholderTabView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        ScrollView {
            VStack(spacing: Spacing.xl) {
                Spacer()
                    .frame(height: 60)

                Image(systemName: icon)
                    .font(.system(size: 64))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.brandPrimary, .blue500],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                VStack(spacing: Spacing.sm) {
                    Text(title)
                        .font(.heading2)
                        .foregroundColor(.slate900)

                    Text(message)
                        .font(.bodySmall)
                        .foregroundColor(.slate600)
                        .multilineTextAlignment(.center)
                }

                Text("Coming Soon")
                    .font(.captionMedium)
                    .foregroundColor(.brandPrimary)
                    .padding(.horizontal, Spacing.lg)
                    .padding(.vertical, Spacing.sm)
                    .background(Color.brandPrimary.opacity(0.1))
                    .cornerRadius(BorderRadius.badge)

                Spacer()
            }
            .padding(Spacing.xl)
        }
        .background(Color.slate50)
    }
}

#Preview {
    TripDetailView(trip: .sample)
        .environment(TripService.shared)
}
