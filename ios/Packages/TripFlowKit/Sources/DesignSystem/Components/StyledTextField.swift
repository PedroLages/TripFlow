//
//  StyledTextField.swift
//  DesignSystem
//
//  Created on 2026-01-04
//
//  Custom text field with visible placeholder for dark backgrounds
//

import SwiftUI

/// Styled text field with visible placeholder text
public struct StyledTextField: View {
    let placeholder: String
    @Binding var text: String
    let isSecure: Bool
    let textContentType: UITextContentType?
    let keyboardType: UIKeyboardType
    let autocapitalization: TextInputAutocapitalization

    public init(
        _ placeholder: String,
        text: Binding<String>,
        isSecure: Bool = false,
        textContentType: UITextContentType? = nil,
        keyboardType: UIKeyboardType = .default,
        autocapitalization: TextInputAutocapitalization = .sentences
    ) {
        self.placeholder = placeholder
        self._text = text
        self.isSecure = isSecure
        self.textContentType = textContentType
        self.keyboardType = keyboardType
        self.autocapitalization = autocapitalization
    }

    public var body: some View {
        ZStack(alignment: .leading) {
            // Placeholder
            if text.isEmpty {
                Text(placeholder)
                    .foregroundColor(.white.opacity(0.5))
                    .padding(.leading, 16)
            }

            // Text field
            Group {
                if isSecure {
                    SecureField("", text: $text)
                        .textContentType(textContentType)
                } else {
                    TextField("", text: $text)
                        .textContentType(textContentType)
                        .keyboardType(keyboardType)
                        .textInputAutocapitalization(autocapitalization)
                }
            }
            .padding()
            .foregroundColor(.white)
        }
        .background(Color.white.opacity(0.1))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.2), lineWidth: 1)
        )
    }
}

/// Styled secure field with password-specific styling
public struct StyledPasswordField: View {
    let placeholder: String
    @Binding var text: String
    let showError: Bool

    public init(
        _ placeholder: String,
        text: Binding<String>,
        showError: Bool = false
    ) {
        self.placeholder = placeholder
        self._text = text
        self.showError = showError
    }

    public var body: some View {
        ZStack(alignment: .leading) {
            // Placeholder
            if text.isEmpty {
                Text(placeholder)
                    .foregroundColor(.white.opacity(0.5))
                    .padding(.leading, 16)
            }

            // Secure field
            SecureField("", text: $text)
                .textContentType(.newPassword)
                .padding()
                .foregroundColor(.white)
        }
        .background(Color.white.opacity(0.1))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(
                    showError ? Color.red : Color.white.opacity(0.2),
                    lineWidth: 1
                )
        )
    }
}
