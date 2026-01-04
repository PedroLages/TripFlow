//
//  Colors.swift
//  DesignSystem
//
//  Created on 2026-01-04
//
//  Design tokens extracted from TripFlow's Tailwind configuration.
//  These colors match the web app exactly for visual consistency.
//
//  Source: /tailwind.config.ts
//

import SwiftUI

public extension Color {
    // MARK: - Brand Colors

    /// Primary brand color - Purple (#8B5CF6)
    static let brandPrimary = Color(hex: "#8B5CF6")

    /// Secondary brand color - Dark Navy (#0F172A)
    static let brandSecondary = Color(hex: "#0F172A")

    /// Accent brand color - Amber (#F59E0B)
    static let brandAccent = Color(hex: "#F59E0B")

    /// Success brand color - Green (#10B981)
    static let brandSuccess = Color(hex: "#10B981")

    // MARK: - Tailwind Slate Palette

    static let slate50 = Color(hex: "#F8FAFC")
    static let slate100 = Color(hex: "#F1F5F9")
    static let slate200 = Color(hex: "#E2E8F0")
    static let slate300 = Color(hex: "#CBD5E1")
    static let slate400 = Color(hex: "#94A3B8")
    static let slate500 = Color(hex: "#64748B")
    static let slate600 = Color(hex: "#475569")
    static let slate700 = Color(hex: "#334155")
    static let slate800 = Color(hex: "#1E293B")
    static let slate900 = Color(hex: "#0F172A")

    // MARK: - Tailwind Blue Palette

    static let blue50 = Color(hex: "#EFF6FF")
    static let blue100 = Color(hex: "#DBEAFE")
    static let blue200 = Color(hex: "#BFDBFE")
    static let blue500 = Color(hex: "#3B82F6")
    static let blue600 = Color(hex: "#2563EB")

    // MARK: - Tailwind Purple Palette

    static let purple50 = Color(hex: "#FAF5FF")
    static let purple100 = Color(hex: "#F3E8FF")
    static let purple500 = Color(hex: "#A855F7")
    static let purple600 = Color(hex: "#9333EA")
    static let purple900 = Color(hex: "#581C87")

    // MARK: - Hex Color Initializer

    /// Initialize a Color from a hex string
    /// - Parameter hex: Hex color string (supports #RGB, #RRGGBB, #RRGGBBAA formats)
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
