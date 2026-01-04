//
//  Trip.swift
//  Core
//
//  Created on 2026-01-04
//
//  Trip model matching Supabase database schema
//

import Foundation

/// Main trip model
public struct Trip: Identifiable, Codable {
    public let id: String
    public let name: String
    public let destination: String
    public let startDate: Date
    public let endDate: Date
    public let description: String?
    public let imageUrl: String?
    public let budget: Double?
    public let ownerId: String
    public let createdAt: Date
    public let updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case destination
        case startDate = "start_date"
        case endDate = "end_date"
        case description
        case imageUrl = "image_url"
        case budget
        case ownerId = "owner_id"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    public init(
        id: String,
        name: String,
        destination: String,
        startDate: Date,
        endDate: Date,
        description: String? = nil,
        imageUrl: String? = nil,
        budget: Double? = nil,
        ownerId: String,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.destination = destination
        self.startDate = startDate
        self.endDate = endDate
        self.description = description
        self.imageUrl = imageUrl
        self.budget = budget
        self.ownerId = ownerId
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

// MARK: - Computed Properties

public extension Trip {
    /// Duration in days
    var durationDays: Int {
        let components = Calendar.current.dateComponents([.day], from: startDate, to: endDate)
        return (components.day ?? 0) + 1 // Include both start and end days
    }

    /// Formatted date range (e.g., "Jan 15 - 20, 2024")
    var dateRangeFormatted: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"

        let startFormatted = formatter.string(from: startDate)
        let endFormatted = formatter.string(from: endDate)

        let yearFormatter = DateFormatter()
        yearFormatter.dateFormat = "yyyy"
        let year = yearFormatter.string(from: endDate)

        return "\(startFormatted) - \(endFormatted), \(year)"
    }

    /// Trip status
    var status: TripStatus {
        let now = Date()
        if endDate < now {
            return .past
        } else if startDate <= now && endDate >= now {
            return .ongoing
        } else {
            return .upcoming
        }
    }

    /// Days until trip starts (negative if past or ongoing)
    var daysUntil: Int {
        let components = Calendar.current.dateComponents([.day], from: Date(), to: startDate)
        return components.day ?? 0
    }
}

/// Trip status enum
public enum TripStatus: String, Codable {
    case upcoming = "upcoming"
    case ongoing = "ongoing"
    case past = "past"

    public var displayName: String {
        switch self {
        case .upcoming: return "Upcoming"
        case .ongoing: return "Ongoing"
        case .past: return "Past"
        }
    }

    public var color: String {
        switch self {
        case .upcoming: return "blue"
        case .ongoing: return "green"
        case .past: return "gray"
        }
    }
}

// MARK: - Sample Data for Previews

#if DEBUG
public extension Trip {
    static let sample = Trip(
        id: "1",
        name: "Summer in Europe",
        destination: "Paris, France",
        startDate: Calendar.current.date(byAdding: .day, value: 30, to: Date())!,
        endDate: Calendar.current.date(byAdding: .day, value: 37, to: Date())!,
        description: "Exploring the city of lights and the Eiffel Tower",
        imageUrl: nil,
        budget: 3500.0,
        ownerId: "user-123"
    )

    static let samples: [Trip] = [
        Trip(
            id: "1",
            name: "Summer in Europe",
            destination: "Paris, France",
            startDate: Calendar.current.date(byAdding: .day, value: 30, to: Date())!,
            endDate: Calendar.current.date(byAdding: .day, value: 37, to: Date())!,
            description: "Exploring the city of lights",
            budget: 3500.0,
            ownerId: "user-123"
        ),
        Trip(
            id: "2",
            name: "Beach Getaway",
            destination: "Bali, Indonesia",
            startDate: Calendar.current.date(byAdding: .day, value: 60, to: Date())!,
            endDate: Calendar.current.date(byAdding: .day, value: 74, to: Date())!,
            description: "Relaxing on tropical beaches",
            budget: 2800.0,
            ownerId: "user-123"
        ),
        Trip(
            id: "3",
            name: "Mountain Adventure",
            destination: "Swiss Alps, Switzerland",
            startDate: Calendar.current.date(byAdding: .day, value: -7, to: Date())!,
            endDate: Calendar.current.date(byAdding: .day, value: -1, to: Date())!,
            description: "Hiking and skiing in the Alps",
            budget: 4200.0,
            ownerId: "user-123"
        )
    ]
}
#endif
