//
//  LoginView.swift
//  Features
//
//  Created on 2026-01-04
//
//  Login screen matching TripFlow web design
//

import SwiftUI
import DesignSystem
import Network

public struct LoginView: View {
    @Environment(AuthService.self) private var auth
    @State private var email = ""
    @State private var password = ""
    @State private var showSignUp = false
    @State private var showError = false

    public init() {}

    public var body: some View {
        ZStack {
            // Background gradient matching web app
            LinearGradient(
                colors: [.brandSecondary, .slate900],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 32) {
                    Spacer(minLength: 60)

                    // Logo and branding
                    VStack(spacing: 16) {
                        Image(systemName: "airplane.departure")
                            .font(.system(size: 64))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.brandPrimary, .blue500],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )

                        Text("TripFlow")
                            .font(.system(size: 36, weight: .bold, design: .rounded))
                            .foregroundColor(.white)

                        Text("Plan your perfect journey")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.slate400)
                    }

                    // Login form
                    VStack(spacing: 20) {
                        // Email field
                        StyledTextField(
                            "Email",
                            text: $email,
                            textContentType: .emailAddress,
                            keyboardType: .emailAddress,
                            autocapitalization: .never
                        )

                        // Password field
                        StyledPasswordField(
                            "Password",
                            text: $password
                        )

                        // Error message
                        if let error = auth.errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(.red)
                                .padding(.horizontal)
                        }

                        // Sign in button
                        Button {
                            Task {
                                try? await auth.signIn(email: email, password: password)
                            }
                        } label: {
                            if auth.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .frame(maxWidth: .infinity)
                            } else {
                                Text("Sign In")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        .frame(height: 52)
                        .background(Color.brandPrimary)
                        .cornerRadius(16)
                        .disabled(auth.isLoading || email.isEmpty || password.isEmpty)
                        .opacity((email.isEmpty || password.isEmpty) ? 0.6 : 1.0)

                        // Divider
                        HStack {
                            Rectangle()
                                .fill(Color.white.opacity(0.2))
                                .frame(height: 1)
                            Text("or")
                                .font(.caption)
                                .foregroundColor(.slate400)
                                .padding(.horizontal, 12)
                            Rectangle()
                                .fill(Color.white.opacity(0.2))
                                .frame(height: 1)
                        }
                        .padding(.vertical, 8)

                        // OAuth buttons
                        VStack(spacing: 12) {
                            Button {
                                Task {
                                    try? await auth.signInWithGoogle()
                                }
                            } label: {
                                HStack {
                                    Image(systemName: "globe")
                                    Text("Continue with Google")
                                        .font(.system(size: 15, weight: .medium))
                                }
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(Color.white.opacity(0.1))
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                                )
                            }
                            .disabled(auth.isLoading)

                            // MARK: - Sign in with Apple (Requires Paid Apple Developer Account)
                            // Temporarily disabled - uncomment when enrolled in Apple Developer Program
                            /*
                            Button {
                                Task {
                                    try? await auth.signInWithApple()
                                }
                            } label: {
                                HStack {
                                    Image(systemName: "apple.logo")
                                    Text("Continue with Apple")
                                        .font(.system(size: 15, weight: .medium))
                                }
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .frame(height: 48)
                                .background(Color.white.opacity(0.1))
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(Color.white.opacity(0.2), lineWidth: 1)
                                )
                            }
                            .disabled(auth.isLoading)
                            */
                        }

                        // Sign up link
                        Button {
                            showSignUp = true
                        } label: {
                            HStack(spacing: 4) {
                                Text("Don't have an account?")
                                    .foregroundColor(.slate400)
                                Text("Sign Up")
                                    .foregroundColor(.brandPrimary)
                                    .fontWeight(.semibold)
                            }
                            .font(.system(size: 14))
                        }
                        .padding(.top, 8)
                    }
                    .padding(.horizontal, 24)

                    Spacer()
                }
            }
        }
        .sheet(isPresented: $showSignUp) {
            SignUpView()
        }
    }
}

#Preview {
    LoginView()
        .environment(AuthService.shared)
}
