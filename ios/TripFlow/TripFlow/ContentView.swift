//
//  ContentView.swift
//  TripFlow
//
//  Created on 2026-01-04
//
//  Root view for the TripFlow app.
//  Shows authentication screens or main app based on auth state.
//

import SwiftUI
import Features
import Network
import DesignSystem
import Auth

struct ContentView: View {
    @Environment(AuthService.self) private var auth

    var body: some View {
        Group {
            if auth.isAuthenticated {
                // Main app content
                DashboardView()
            } else {
                // Show login screen
                LoginView()
            }
        }
    }
}

/// Placeholder dashboard shown when authenticated
struct DashboardPlaceholder: View {
    @Environment(AuthService.self) private var auth

    var body: some View {
        VStack(spacing: 32) {
            // Header
            VStack(spacing: 8) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(Color.brandSuccess)

                Text("Authentication Success!")
                    .font(.system(size: 28, weight: .bold, design: .rounded))

                if let email = auth.user?.email {
                    Text("Signed in as: \(email)")
                        .font(.system(size: 15))
                        .foregroundColor(.secondary)
                }
            }

            // Status
            VStack(spacing: 12) {
                StatusRow(icon: "checkmark.circle.fill", text: "Swift Package Manager", color: .green)
                StatusRow(icon: "checkmark.circle.fill", text: "iOS 17+ @Observable", color: .green)
                StatusRow(icon: "checkmark.circle.fill", text: "Authentication Working", color: .green)
                StatusRow(icon: "checkmark.circle.fill", text: "Supabase Connected", color: .green)
            }
            .padding()
            .background(.ultraThinMaterial)
            .cornerRadius(20)

            Text("Next: Build trip dashboard UI")
                .font(.caption)
                .foregroundColor(.secondary)

            // Sign out button
            Button {
                Task {
                    await auth.signOut()
                }
            } label: {
                Text("Sign Out")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(Color.red)
                    .cornerRadius(12)
            }
            .padding(.horizontal, 32)
        }
        .padding()
    }
}

struct StatusRow: View {
    let icon: String
    let text: String
    let color: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .font(.system(size: 16))

            Text(text)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.primary)

            Spacer()
        }
    }
}

#Preview {
    ContentView()
}
