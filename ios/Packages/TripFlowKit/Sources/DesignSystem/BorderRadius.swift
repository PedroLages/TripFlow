//
//  BorderRadius.swift
//  DesignSystem
//
//  Created on 2026-01-04
//
//  Border radius constants matching Tailwind CSS
//  Used for consistent rounded corners across the app
//

import SwiftUI

/// Border radius constants following Tailwind CSS scale
public enum BorderRadius {
    /// 0px - No rounding
    public static let none: CGFloat = 0

    /// 2px - Subtle rounding
    public static let sm: CGFloat = 2

    /// 4px - Small rounding
    public static let base: CGFloat = 4

    /// 6px - Default rounding
    public static let md: CGFloat = 6

    /// 8px - Medium rounding
    public static let lg: CGFloat = 8

    /// 12px - Large rounding
    public static let xl: CGFloat = 12

    /// 16px - Extra large rounding
    public static let xxl: CGFloat = 16

    /// 20px - 2XL rounding
    public static let xxxl: CGFloat = 20

    /// 24px - 3XL rounding
    public static let xxxxl: CGFloat = 24

    /// 999px - Full rounding (circular)
    public static let full: CGFloat = 999

    // MARK: - Component-Specific Radius

    /// Default button corner radius (12px)
    public static let button = xl

    /// Default card corner radius (16px)
    public static let card = xxl

    /// Default modal corner radius (24px)
    public static let modal = xxxxl

    /// Default input field corner radius (12px)
    public static let input = xl

    /// Default badge corner radius (full)
    public static let badge = full

    /// Default avatar corner radius (full)
    public static let avatar = full

    /// Default chip corner radius (16px)
    public static let chip = xxl
}

// MARK: - Border Radius View Modifiers

public extension View {
    /// Apply corner radius with Tailwind scale
    func cornerRadius(_ radius: CGFloat) -> some View {
        self.clipShape(RoundedRectangle(cornerRadius: radius))
    }

    /// Apply button corner radius (12px)
    func buttonRadius() -> some View {
        self.cornerRadius(BorderRadius.button)
    }

    /// Apply card corner radius (16px)
    func cardRadius() -> some View {
        self.cornerRadius(BorderRadius.card)
    }

    /// Apply modal corner radius (24px)
    func modalRadius() -> some View {
        self.cornerRadius(BorderRadius.modal)
    }

    /// Apply input field corner radius (12px)
    func inputRadius() -> some View {
        self.cornerRadius(BorderRadius.input)
    }

    /// Apply circular corner radius
    func circularRadius() -> some View {
        self.clipShape(Circle())
    }
}

// MARK: - Rounded Rectangle with Custom Corners

public extension View {
    /// Apply corner radius to specific corners
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        self.clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

/// Custom shape for rounding specific corners
struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}
