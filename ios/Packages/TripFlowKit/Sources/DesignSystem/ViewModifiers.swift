//
//  ViewModifiers.swift
//  DesignSystem
//
//  Created on 2026-01-04
//
//  Reusable view modifiers for consistent styling
//  Provides .tripCard, .primaryButton, and other common modifiers
//

import SwiftUI

// MARK: - Button Modifiers

/// Primary button style matching TripFlow design
public struct PrimaryButtonModifier: ViewModifier {
    let isEnabled: Bool

    public init(isEnabled: Bool = true) {
        self.isEnabled = isEnabled
    }

    public func body(content: Content) -> some View {
        content
            .font(.button)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .frame(height: Spacing.buttonHeight)
            .background(isEnabled ? Color.brandPrimary : Color.gray)
            .cornerRadius(BorderRadius.button)
            .shadow(color: Color.black.opacity(0.1), radius: 4, y: 2)
            .opacity(isEnabled ? 1.0 : 0.6)
    }
}

/// Secondary button style
public struct SecondaryButtonModifier: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .font(.button)
            .foregroundColor(.brandPrimary)
            .frame(maxWidth: .infinity)
            .frame(height: Spacing.buttonHeight)
            .background(Color.brandPrimary.opacity(0.1))
            .cornerRadius(BorderRadius.button)
    }
}

/// Outline button style
public struct OutlineButtonModifier: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .font(.button)
            .foregroundColor(.brandPrimary)
            .frame(maxWidth: .infinity)
            .frame(height: Spacing.buttonHeight)
            .background(Color.clear)
            .cornerRadius(BorderRadius.button)
            .overlay(
                RoundedRectangle(cornerRadius: BorderRadius.button)
                    .stroke(Color.brandPrimary, lineWidth: 2)
            )
    }
}

// MARK: - Card Modifiers

/// Trip card style matching web design
public struct TripCardModifier: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .padding(Spacing.cardPadding)
            .background(Color.white)
            .cornerRadius(BorderRadius.card)
            .shadow(color: Color.black.opacity(0.08), radius: 8, y: 4)
    }
}

/// Elevated card with stronger shadow
public struct ElevatedCardModifier: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .padding(Spacing.cardPadding)
            .background(Color.white)
            .cornerRadius(BorderRadius.card)
            .shadow(color: Color.black.opacity(0.12), radius: 12, y: 6)
    }
}

/// Subtle card with minimal shadow
public struct SubtleCardModifier: ViewModifier {
    public func body(content: Content) -> some View {
        content
            .padding(Spacing.cardPadding)
            .background(Color.slate50)
            .cornerRadius(BorderRadius.card)
    }
}

// MARK: - Badge Modifiers

/// Badge style for status indicators
public struct BadgeModifier: ViewModifier {
    let color: Color

    public init(color: Color = .brandPrimary) {
        self.color = color
    }

    public func body(content: Content) -> some View {
        content
            .font(.caption)
            .foregroundColor(.white)
            .padding(.horizontal, Spacing.space12)
            .padding(.vertical, Spacing.space4)
            .background(color)
            .cornerRadius(BorderRadius.badge)
    }
}

// MARK: - Input Field Modifiers

/// Standard input field style
public struct InputFieldModifier: ViewModifier {
    let isFocused: Bool

    public init(isFocused: Bool = false) {
        self.isFocused = isFocused
    }

    public func body(content: Content) -> some View {
        content
            .padding(Spacing.md)
            .background(Color.slate50)
            .cornerRadius(BorderRadius.input)
            .overlay(
                RoundedRectangle(cornerRadius: BorderRadius.input)
                    .stroke(
                        isFocused ? Color.brandPrimary : Color.slate200,
                        lineWidth: isFocused ? 2 : 1
                    )
            )
    }
}

// MARK: - View Extensions

public extension View {
    /// Apply primary button style
    func primaryButton(isEnabled: Bool = true) -> some View {
        self.modifier(PrimaryButtonModifier(isEnabled: isEnabled))
    }

    /// Apply secondary button style
    func secondaryButton() -> some View {
        self.modifier(SecondaryButtonModifier())
    }

    /// Apply outline button style
    func outlineButton() -> some View {
        self.modifier(OutlineButtonModifier())
    }

    /// Apply trip card style
    func tripCard() -> some View {
        self.modifier(TripCardModifier())
    }

    /// Apply elevated card style
    func elevatedCard() -> some View {
        self.modifier(ElevatedCardModifier())
    }

    /// Apply subtle card style
    func subtleCard() -> some View {
        self.modifier(SubtleCardModifier())
    }

    /// Apply badge style
    func badge(color: Color = .brandPrimary) -> some View {
        self.modifier(BadgeModifier(color: color))
    }

    /// Apply input field style
    func inputField(isFocused: Bool = false) -> some View {
        self.modifier(InputFieldModifier(isFocused: isFocused))
    }
}

// MARK: - Animation Modifiers

public extension View {
    /// Apply scale animation on tap
    func scaledOnTap() -> some View {
        self
            .scaleEffect(1.0)
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: UUID())
    }

    /// Apply smooth transition
    func smoothTransition() -> some View {
        self.animation(.easeInOut(duration: 0.3), value: UUID())
    }
}
