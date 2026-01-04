//
//  AuthService.swift
//  Network
//
//  Created on 2026-01-04
//
//  Authentication service using Supabase Auth
//  Supports email/password, Google OAuth, and Sign in with Apple
//

import Foundation
import Supabase
import AuthenticationServices

/// Observable authentication service managing user session state
///
/// Usage in SwiftUI:
/// ```swift
/// @Environment(AuthService.self) private var auth
///
/// if auth.isAuthenticated {
///     Text("Welcome, \(auth.user?.email ?? "")")
/// }
/// ```
@Observable
public final class AuthService {
    /// Shared singleton instance
    public static let shared = AuthService()

    // MARK: - Published State

    /// Current authenticated user (nil if not logged in)
    public private(set) var user: User?

    /// Current session
    public private(set) var session: Session?

    /// Computed property: true if user is authenticated
    public var isAuthenticated: Bool {
        user != nil && session != nil
    }

    /// Loading state for async operations
    public private(set) var isLoading = false

    /// Error message from last operation
    public private(set) var errorMessage: String?

    // MARK: - Private Properties

    private let supabase = SupabaseService.shared.client

    // MARK: - Initialization

    private init() {
        // Check for existing session on init
        Task {
            await checkSession()
        }
    }

    // MARK: - Session Management

    /// Check if there's an existing session
    @MainActor
    public func checkSession() async {
        do {
            let session = try await supabase.auth.session
            self.session = session
            self.user = session.user
        } catch {
            // No existing session - user needs to log in
            self.session = nil
            self.user = nil
        }
    }

    /// Sign out the current user
    @MainActor
    public func signOut() async {
        isLoading = true
        errorMessage = nil

        do {
            try await supabase.auth.signOut()
            self.session = nil
            self.user = nil
        } catch {
            errorMessage = "Failed to sign out: \(error.localizedDescription)"
        }

        isLoading = false
    }

    // MARK: - Email/Password Authentication

    /// Sign in with email and password
    @MainActor
    public func signIn(email: String, password: String) async throws {
        isLoading = true
        errorMessage = nil

        do {
            try await supabase.auth.signIn(
                email: email,
                password: password
            )
            // Get the current session after successful sign in
            let session = try await supabase.auth.session
            self.session = session
            self.user = session.user
        } catch {
            errorMessage = error.localizedDescription
            throw error
        }

        isLoading = false
    }

    /// Sign up with email and password
    @MainActor
    public func signUp(email: String, password: String, fullName: String?) async throws {
        isLoading = true
        errorMessage = nil

        do {
            try await supabase.auth.signUp(
                email: email,
                password: password,
                data: fullName.map { ["full_name": .string($0)] }
            )
            // Get the current session after successful sign up
            // Note: session may be nil if email confirmation is required
            let session = try? await supabase.auth.session
            self.session = session
            self.user = session?.user
        } catch {
            errorMessage = error.localizedDescription
            throw error
        }

        isLoading = false
    }

    /// Send password reset email
    @MainActor
    public func resetPassword(email: String) async throws {
        isLoading = true
        errorMessage = nil

        do {
            try await supabase.auth.resetPasswordForEmail(email)
        } catch {
            errorMessage = error.localizedDescription
            throw error
        }

        isLoading = false
    }

    // MARK: - OAuth Authentication

    /// Sign in with Google OAuth
    @MainActor
    public func signInWithGoogle() async throws {
        isLoading = true
        errorMessage = nil

        do {
            // TODO: Implement Google OAuth flow
            // Requires setting up Google OAuth in Supabase dashboard
            // and configuring URL scheme in Xcode project
            throw AuthError.notImplemented("Google OAuth not yet configured")
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            throw error
        }
    }

    /// Sign in with Apple
    @MainActor
    public func signInWithApple() async throws {
        isLoading = true
        errorMessage = nil

        do {
            // TODO: Implement Sign in with Apple flow
            // Required for App Store if offering Google OAuth
            throw AuthError.notImplemented("Sign in with Apple not yet configured")
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            throw error
        }
    }
}

// MARK: - Custom Errors

public enum AuthError: LocalizedError {
    case notImplemented(String)

    public var errorDescription: String? {
        switch self {
        case .notImplemented(let message):
            return message
        }
    }
}
