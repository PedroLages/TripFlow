//
//  Typography.swift
//  DesignSystem
//
//  Created on 2026-01-04
//
//  Typography system using SF Pro font family (iOS system default)
//  Matches TripFlow web design scale and hierarchy
//

import SwiftUI

public extension Font {
    // MARK: - Display Fonts (Large Headlines)

    /// Display XL - 64px, bold, rounded
    static let displayXL = Font.system(size: 64, weight: .bold, design: .rounded)

    /// Display Large - 56px, bold, rounded
    static let displayLarge = Font.system(size: 56, weight: .bold, design: .rounded)

    /// Display Medium - 48px, bold, rounded
    static let displayMedium = Font.system(size: 48, weight: .bold, design: .rounded)

    /// Display Small - 36px, bold, rounded
    static let displaySmall = Font.system(size: 36, weight: .bold, design: .rounded)

    // MARK: - Heading Fonts

    /// Heading 1 - 32px, bold
    static let heading1 = Font.system(size: 32, weight: .bold)

    /// Heading 2 - 28px, semibold
    static let heading2 = Font.system(size: 28, weight: .semibold)

    /// Heading 3 - 24px, semibold
    static let heading3 = Font.system(size: 24, weight: .semibold)

    /// Heading 4 - 20px, semibold
    static let heading4 = Font.system(size: 20, weight: .semibold)

    /// Heading 5 - 18px, semibold
    static let heading5 = Font.system(size: 18, weight: .semibold)

    /// Heading 6 - 16px, semibold
    static let heading6 = Font.system(size: 16, weight: .semibold)

    // MARK: - Body Text

    /// Body Large - 18px, regular
    static let bodyLarge = Font.system(size: 18, weight: .regular)

    /// Body Regular - 16px, regular (default body text)
    static let bodyRegular = Font.system(size: 16, weight: .regular)

    /// Body Medium - 16px, medium
    static let bodyMedium = Font.system(size: 16, weight: .medium)

    /// Body Small - 14px, regular
    static let bodySmall = Font.system(size: 14, weight: .regular)

    /// Body Small Medium - 14px, medium
    static let bodySmallMedium = Font.system(size: 14, weight: .medium)

    // MARK: - Caption & Labels

    /// Caption Regular - 12px, regular (use SwiftUI's .caption for standard)
    static let captionRegular = Font.system(size: 12, weight: .regular)

    /// Caption Medium - 12px, medium
    static let captionMedium = Font.system(size: 12, weight: .medium)

    /// Label - 11px, medium
    static let labelMedium = Font.system(size: 11, weight: .medium)

    // MARK: - Special Purpose

    /// Monospace - for code, numbers, etc.
    static let mono = Font.system(size: 14, design: .monospaced)

    /// Button Text - 16px, semibold
    static let button = Font.system(size: 16, weight: .semibold)

    /// Button Small - 14px, medium
    static let buttonSmall = Font.system(size: 14, weight: .medium)
}

// MARK: - Typography View Modifiers

public extension View {
    /// Apply display XL typography (64px bold rounded)
    func displayXL() -> some View {
        self.font(.displayXL)
    }

    /// Apply heading 1 typography (32px bold)
    func heading1() -> some View {
        self.font(.heading1)
    }

    /// Apply heading 2 typography (28px semibold)
    func heading2() -> some View {
        self.font(.heading2)
    }

    /// Apply heading 3 typography (24px semibold)
    func heading3() -> some View {
        self.font(.heading3)
    }

    /// Apply body typography (16px regular)
    func bodyText() -> some View {
        self.font(.bodyRegular)
    }
}

// MARK: - Line Height & Letter Spacing

public struct TypographyStyle {
    let font: Font
    let lineSpacing: CGFloat
    let letterSpacing: CGFloat?

    public init(font: Font, lineSpacing: CGFloat = 0, letterSpacing: CGFloat? = nil) {
        self.font = font
        self.lineSpacing = lineSpacing
        self.letterSpacing = letterSpacing
    }
}

public extension TypographyStyle {
    /// Display text with proper line height
    static let display = TypographyStyle(font: .displayMedium, lineSpacing: 8)

    /// Title text with tight line height
    static let title = TypographyStyle(font: .heading2, lineSpacing: 4)

    /// Body text with comfortable reading line height
    static let bodyComfortable = TypographyStyle(font: .bodyRegular, lineSpacing: 6)
}

public extension View {
    /// Apply typography style with line spacing
    func typographyStyle(_ style: TypographyStyle) -> some View {
        self
            .font(style.font)
            .lineSpacing(style.lineSpacing)
            .modifier(LetterSpacingModifier(spacing: style.letterSpacing))
    }
}

private struct LetterSpacingModifier: ViewModifier {
    let spacing: CGFloat?

    func body(content: Content) -> some View {
        if let spacing = spacing {
            content.kerning(spacing)
        } else {
            content
        }
    }
}
