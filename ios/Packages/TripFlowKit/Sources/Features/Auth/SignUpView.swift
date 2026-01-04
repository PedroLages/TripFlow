//
//  SignUpView.swift
//  Features
//
//  Created on 2026-01-04
//
//  Sign up screen matching TripFlow web design
//

import SwiftUI
import DesignSystem
import Network

public struct SignUpView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AuthService.self) private var auth

    @State private var fullName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var showSuccessMessage = false

    public init() {}

    private var isFormValid: Bool {
        !fullName.isEmpty &&
        !email.isEmpty &&
        !password.isEmpty &&
        password == confirmPassword &&
        password.count >= 6
    }

    public var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [.brandSecondary, .slate900],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack {
                // Header
                HStack {
                    Button {
                        dismiss()
                    } label: {
                        Image(systemName: "xmark")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.white)
                            .frame(width: 36, height: 36)
                            .background(Color.white.opacity(0.1))
                            .clipShape(Circle())
                    }
                    Spacer()
                }
                .padding()

                ScrollView {
                    VStack(spacing: 32) {
                        // Branding
                        VStack(spacing: 12) {
                            Image(systemName: "airplane.departure")
                                .font(.system(size: 48))
                                .foregroundStyle(
                                    LinearGradient(
                                        colors: [.brandPrimary, .blue500],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )

                            Text("Create Account")
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                                .foregroundColor(.white)

                            Text("Start planning your adventures")
                                .font(.system(size: 15))
                                .foregroundColor(.slate400)
                        }

                        // Sign up form
                        VStack(spacing: 16) {
                            // Full name
                            StyledTextField(
                                "Full Name",
                                text: $fullName,
                                textContentType: .name,
                                autocapitalization: .words
                            )

                            // Email
                            StyledTextField(
                                "Email",
                                text: $email,
                                textContentType: .emailAddress,
                                keyboardType: .emailAddress,
                                autocapitalization: .never
                            )

                            // Password
                            StyledPasswordField(
                                "Password (min 6 characters)",
                                text: $password
                            )

                            // Confirm password
                            StyledPasswordField(
                                "Confirm Password",
                                text: $confirmPassword,
                                showError: !confirmPassword.isEmpty && password != confirmPassword
                            )

                            // Password mismatch warning
                            if !confirmPassword.isEmpty && password != confirmPassword {
                                HStack {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                    Text("Passwords don't match")
                                }
                                .font(.caption)
                                .foregroundColor(.red)
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }

                            // Error message
                            if let error = auth.errorMessage {
                                Text(error)
                                    .font(.caption)
                                    .foregroundColor(.red)
                                    .padding(.horizontal)
                            }

                            // Success message
                            if showSuccessMessage {
                                VStack(spacing: 12) {
                                    HStack {
                                        Image(systemName: "checkmark.circle.fill")
                                        Text("Account created!")
                                    }
                                    .font(.system(size: 15, weight: .semibold))
                                    .foregroundColor(.brandSuccess)

                                    Text("Check your email to verify your account, then sign in.")
                                        .font(.caption)
                                        .foregroundColor(.slate400)
                                        .multilineTextAlignment(.center)

                                    Button {
                                        dismiss()
                                    } label: {
                                        Text("Back to Sign In")
                                            .font(.system(size: 14, weight: .medium))
                                            .foregroundColor(.brandPrimary)
                                    }
                                }
                                .padding()
                                .background(Color.brandSuccess.opacity(0.1))
                                .cornerRadius(12)
                            }

                            // Sign up button (hide when success message is shown)
                            if !showSuccessMessage {
                                Button {
                                    Task {
                                        do {
                                            try await auth.signUp(
                                                email: email,
                                                password: password,
                                                fullName: fullName
                                            )

                                            // If authenticated immediately (no email confirmation required)
                                            if auth.isAuthenticated {
                                                dismiss()
                                            } else {
                                                // Email confirmation required
                                                showSuccessMessage = true
                                            }
                                        } catch {
                                            // Error will be shown via auth.errorMessage
                                        }
                                    }
                                } label: {
                                    if auth.isLoading {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                            .frame(maxWidth: .infinity)
                                    } else {
                                        Text("Create Account")
                                            .font(.system(size: 16, weight: .semibold))
                                            .foregroundColor(.white)
                                            .frame(maxWidth: .infinity)
                                    }
                                }
                                .frame(height: 52)
                                .background(Color.brandPrimary)
                                .cornerRadius(16)
                                .disabled(auth.isLoading || !isFormValid)
                                .opacity(isFormValid ? 1.0 : 0.6)
                                .padding(.top, 8)
                            }

                            // Terms text
                            Text("By creating an account, you agree to our Terms of Service and Privacy Policy")
                                .font(.caption)
                                .foregroundColor(.slate400)
                                .multilineTextAlignment(.center)
                                .padding(.top, 4)
                        }
                        .padding(.horizontal, 24)
                    }
                    .padding(.bottom, 32)
                }
            }
        }
    }
}

#Preview {
    SignUpView()
        .environment(AuthService.shared)
}
