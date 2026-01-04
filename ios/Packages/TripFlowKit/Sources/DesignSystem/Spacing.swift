//
//  Spacing.swift
//  DesignSystem
//
//  Created on 2026-01-04
//
//  Spacing scale matching Tailwind CSS
//  Base unit: 4px (0.25rem)
//

import SwiftUI

/// Spacing constants following Tailwind CSS scale
public enum Spacing {
    /// 0px
    public static let space0: CGFloat = 0

    /// 1px
    public static let space1: CGFloat = 1

    /// 2px (0.5 * base)
    public static let space2: CGFloat = 2

    /// 4px (1 * base) - Base spacing unit
    public static let space4: CGFloat = 4

    /// 6px (1.5 * base)
    public static let space6: CGFloat = 6

    /// 8px (2 * base)
    public static let space8: CGFloat = 8

    /// 10px (2.5 * base)
    public static let space10: CGFloat = 10

    /// 12px (3 * base)
    public static let space12: CGFloat = 12

    /// 14px (3.5 * base)
    public static let space14: CGFloat = 14

    /// 16px (4 * base)
    public static let space16: CGFloat = 16

    /// 20px (5 * base)
    public static let space20: CGFloat = 20

    /// 24px (6 * base)
    public static let space24: CGFloat = 24

    /// 28px (7 * base)
    public static let space28: CGFloat = 28

    /// 32px (8 * base)
    public static let space32: CGFloat = 32

    /// 36px (9 * base)
    public static let space36: CGFloat = 36

    /// 40px (10 * base)
    public static let space40: CGFloat = 40

    /// 44px (11 * base)
    public static let space44: CGFloat = 44

    /// 48px (12 * base)
    public static let space48: CGFloat = 48

    /// 56px (14 * base)
    public static let space56: CGFloat = 56

    /// 64px (16 * base)
    public static let space64: CGFloat = 64

    /// 80px (20 * base)
    public static let space80: CGFloat = 80

    /// 96px (24 * base)
    public static let space96: CGFloat = 96

    /// 112px (28 * base)
    public static let space112: CGFloat = 112

    /// 128px (32 * base)
    public static let space128: CGFloat = 128

    // MARK: - Semantic Spacing

    /// Extra small spacing (4px)
    public static let xs = space4

    /// Small spacing (8px)
    public static let sm = space8

    /// Medium spacing (16px)
    public static let md = space16

    /// Large spacing (24px)
    public static let lg = space24

    /// Extra large spacing (32px)
    public static let xl = space32

    /// 2XL spacing (48px)
    public static let xxl = space48

    /// 3XL spacing (64px)
    public static let xxxl = space64

    // MARK: - Component-Specific Spacing

    /// Default card padding (16px)
    public static let cardPadding = space16

    /// Default section spacing (24px)
    public static let sectionSpacing = space24

    /// Default screen padding (20px)
    public static let screenPadding = space20

    /// Default button height (48px)
    public static let buttonHeight = space48

    /// Small button height (40px)
    public static let buttonHeightSmall = space40

    /// Input field height (48px)
    public static let inputHeight = space48
}

// MARK: - Spacing View Modifiers

public extension View {
    /// Add default screen padding (20px horizontal)
    func screenPadding() -> some View {
        self.padding(.horizontal, Spacing.screenPadding)
    }

    /// Add default card padding (16px all sides)
    func cardPadding() -> some View {
        self.padding(Spacing.cardPadding)
    }
}
