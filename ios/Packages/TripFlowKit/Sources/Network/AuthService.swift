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
            // Use Supabase OAuth flow with Google provider
            // The SDK will handle the OAuth dance and callback
            try await supabase.auth.signInWithOAuth(
                provider: .google,
                redirectTo: URL(string: "tripflow://auth/callback")
            )

            // After OAuth completes, check for session
            // Note: The session will be set when the deep link callback is handled
            try await Task.sleep(nanoseconds: 500_000_000) // 0.5 second delay
            await checkSession()

            if !isAuthenticated {
                throw AuthError.invalidCredential("OAuth sign in was not completed")
            }

            isLoading = false
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            throw error
        }
    }

    /// Handle OAuth callback from deep link
    @MainActor
    public func handleOAuthCallback(url: URL) async throws {
        do {
            try await supabase.auth.session(from: url)
            await checkSession()
        } catch {
            errorMessage = "Failed to complete OAuth sign in: \(error.localizedDescription)"
            throw error
        }
    }

    /// Sign in with Apple
    @MainActor
    public func signInWithApple() async throws {
        isLoading = true
        errorMessage = nil

        do {
            // Create Apple ID credential request
            let provider = ASAuthorizationAppleIDProvider()
            let request = provider.createRequest()
            request.requestedScopes = [.fullName, .email]

            // Create coordinator
            let coordinator = AppleSignInCoordinator()

            // Perform authorization
            let authorization = try await coordinator.signIn(with: request)

            guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential else {
                throw AuthError.invalidCredential("Invalid Apple ID credential")
            }

            guard let identityToken = appleIDCredential.identityToken,
                  let tokenString = String(data: identityToken, encoding: .utf8) else {
                throw AuthError.invalidCredential("Unable to get identity token")
            }

            // Sign in to Supabase with the ID token
            try await supabase.auth.signInWithIdToken(
                credentials: .init(
                    provider: .apple,
                    idToken: tokenString
                )
            )

            // Get the session
            let session = try await supabase.auth.session
            self.session = session
            self.user = session.user

            isLoading = false
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
    case invalidCredential(String)
    case cancelled

    public var errorDescription: String? {
        switch self {
        case .notImplemented(let message):
            return message
        case .invalidCredential(let message):
            return message
        case .cancelled:
            return "Sign in was cancelled"
        }
    }
}

// MARK: - Apple Sign In Coordinator

/// Coordinator to handle async Sign in with Apple flow
@MainActor
final class AppleSignInCoordinator: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    private var continuation: CheckedContinuation<ASAuthorization, Error>?

    func signIn(with request: ASAuthorizationAppleIDRequest) async throws -> ASAuthorization {
        return try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    // MARK: - ASAuthorizationControllerDelegate

    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        Task { @MainActor in
            continuation?.resume(returning: authorization)
            continuation = nil
        }
    }

    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        Task { @MainActor in
            if let authError = error as? ASAuthorizationError,
               authError.code == .canceled {
                continuation?.resume(throwing: AuthError.cancelled)
            } else {
                continuation?.resume(throwing: error)
            }
            continuation = nil
        }
    }

    // MARK: - ASAuthorizationControllerPresentationContextProviding

    nonisolated func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        // Get the key window
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = scene.windows.first else {
            fatalError("No window available for Sign in with Apple")
        }
        return window
    }
}
