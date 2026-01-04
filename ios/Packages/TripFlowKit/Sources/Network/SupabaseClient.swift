//
//  SupabaseClient.swift
//  Network
//
//  Created on 2026-01-04
//
//  Supabase client singleton for TripFlow iOS
//  Shared by all network services (Auth, Database, Storage, etc.)
//

import Foundation
import Supabase

/// Singleton service providing access to Supabase client
///
/// Usage:
/// ```swift
/// let client = SupabaseService.shared.client
/// let user = try await client.auth.session.user
/// ```
public final class SupabaseService {
    /// Shared singleton instance
    public static let shared = SupabaseService()

    /// Configured Supabase client
    public let client: SupabaseClient

    private init() {
        // Production Supabase credentials from TripFlow web app
        let supabaseURL = URL(string: "https://xnmbvjlhwrukliuzhhvf.supabase.co")!
        let supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubWJ2amxod3J1a2xpdXpoaHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyMTA0NjUsImV4cCI6MjA4Mjc4NjQ2NX0.gF6g_CBzJgn9pKWhgoL63yWD_wljCjFW32B7fEAx3bg"

        self.client = SupabaseClient(
            supabaseURL: supabaseURL,
            supabaseKey: supabaseKey
        )
    }
}
