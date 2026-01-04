//
//  TripFlowApp.swift
//  TripFlow
//
//  Created on 2026-01-04
//
//  Main app entry point for TripFlow iOS application.
//  Uses SwiftUI lifecycle and @Observable state management (iOS 17+)
//

import SwiftUI
import Network

@main
struct TripFlowApp: App {
    @State private var authService = AuthService.shared
    @State private var tripService = TripService.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(authService)
                .environment(tripService)
        }
    }
}
