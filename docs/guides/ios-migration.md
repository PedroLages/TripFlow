# iOS Migration Guide

> Complete guide for building TripFlow in Swift/SwiftUI

## Overview

This document tracks the migration of TripFlow from React/Tailwind web app to native Swift/SwiftUI iOS app. The goal is to recreate the same visual design and functionality using iOS-native technologies.

## Key Principles

### ❌ What We're NOT Doing
- **NOT using Tailwind** - Tailwind is CSS-only and doesn't work in Swift
- **NOT using Capacitor/React Native** - Building truly native Swift app
- **NOT creating a separate backend** - Continue using existing Supabase backend

### ✅ What We ARE Doing
- **Extract design tokens** - Pull colors, spacing, typography from Tailwind config
- **Recreate visual design** - Use SwiftUI modifiers to match web app appearance
- **Share backend** - Both web and iOS use same Supabase project
- **Native iOS features** - Add widgets, shortcuts, haptics, etc.

---

## Design Token Extraction

From `/tailwind.config.ts`, here are our design tokens:

### Colors
```swift
// ios/TripFlow/Shared/DesignSystem/Colors.swift
import SwiftUI

extension Color {
    // Brand Colors (from Tailwind config)
    static let brandPrimary = Color(hex: "#8B5CF6")    // Purple
    static let brandSecondary = Color(hex: "#0F172A")  // Dark Navy
    static let brandAccent = Color(hex: "#F59E0B")     // Amber
    static let brandSuccess = Color(hex: "#10B981")    // Green

    // Tailwind Slate Palette (commonly used)
    static let slate50 = Color(hex: "#F8FAFC")
    static let slate100 = Color(hex: "#F1F5F9")
    static let slate200 = Color(hex: "#E2E8F0")
    static let slate300 = Color(hex: "#CBD5E1")
    static let slate400 = Color(hex: "#94A3B8")
    static let slate500 = Color(hex: "#64748B")
    static let slate600 = Color(hex: "#475569")
    static let slate700 = Color(hex: "#334155")
    static let slate800 = Color(hex: "#1E293B")
    static let slate900 = Color(hex: "#0F172A")

    // Tailwind Blue Palette
    static let blue50 = Color(hex: "#EFF6FF")
    static let blue100 = Color(hex: "#DBEAFE")
    static let blue200 = Color(hex: "#BFDBFE")
    static let blue500 = Color(hex: "#3B82F6")
    static let blue600 = Color(hex: "#2563EB")

    // Tailwind Purple Palette
    static let purple50 = Color(hex: "#FAF5FF")
    static let purple100 = Color(hex: "#F3E8FF")
    static let purple500 = Color(hex: "#A855F7")
    static let purple600 = Color(hex: "#9333EA")
    static let purple900 = Color(hex: "#581C87")

    // Utility: Initialize from hex string
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
```

### Typography
```swift
// ios/TripFlow/Shared/DesignSystem/Typography.swift
import SwiftUI

struct Typography {
    // Font Families (from Tailwind config)
    static let displayFont = "Space Grotesk"  // font-display
    static let bodyFont = "Plus Jakarta Sans" // font-sans

    // Text Styles
    static let largeTitle = Font.custom(displayFont, size: 34).weight(.bold)
    static let title1 = Font.custom(displayFont, size: 28).weight(.bold)
    static let title2 = Font.custom(displayFont, size: 22).weight(.bold)
    static let title3 = Font.custom(displayFont, size: 20).weight(.semibold)
    static let headline = Font.custom(bodyFont, size: 17).weight(.semibold)
    static let body = Font.custom(bodyFont, size: 17).weight(.regular)
    static let callout = Font.custom(bodyFont, size: 16).weight(.regular)
    static let subheadline = Font.custom(bodyFont, size: 15).weight(.regular)
    static let footnote = Font.custom(bodyFont, size: 13).weight(.regular)
    static let caption = Font.custom(bodyFont, size: 12).weight(.regular)
}
```

### Spacing
```swift
// ios/TripFlow/Shared/DesignSystem/Spacing.swift
import SwiftUI

struct Spacing {
    // Tailwind Spacing Scale
    // Tailwind uses 0.25rem (4px) base unit

    static let px: CGFloat = 1      // 1px
    static let unit0: CGFloat = 0   // 0
    static let unit1: CGFloat = 4   // 0.25rem
    static let unit2: CGFloat = 8   // 0.5rem  - gap-2, p-2
    static let unit3: CGFloat = 12  // 0.75rem - gap-3, p-3
    static let unit4: CGFloat = 16  // 1rem    - gap-4, p-4
    static let unit5: CGFloat = 20  // 1.25rem - gap-5, p-5
    static let unit6: CGFloat = 24  // 1.5rem  - gap-6, p-6, px-6, py-6
    static let unit8: CGFloat = 32  // 2rem    - gap-8, p-8, px-8, py-8
    static let unit10: CGFloat = 40 // 2.5rem
    static let unit12: CGFloat = 48 // 3rem
    static let unit16: CGFloat = 64 // 4rem

    // Common Patterns
    static let cardPadding: CGFloat = unit6      // p-6
    static let modalPadding: CGFloat = unit8     // p-8
    static let buttonPaddingX: CGFloat = unit6   // px-6
    static let buttonPaddingY: CGFloat = unit3   // py-3
}
```

### Border Radius
```swift
// ios/TripFlow/Shared/DesignSystem/BorderRadius.swift
import SwiftUI

struct BorderRadius {
    // Standard Tailwind
    static let none: CGFloat = 0
    static let sm: CGFloat = 2      // rounded-sm
    static let base: CGFloat = 4    // rounded
    static let md: CGFloat = 6      // rounded-md
    static let lg: CGFloat = 8      // rounded-lg
    static let xl: CGFloat = 12     // rounded-xl
    static let xl2: CGFloat = 16    // rounded-2xl

    // Extended (from Tailwind config)
    static let xl3: CGFloat = 24    // rounded-3xl (1.5rem)
    static let xl4: CGFloat = 32    // rounded-4xl (2rem)
    static let xl5: CGFloat = 48    // rounded-5xl (3rem)

    // Custom TripFlow Values
    static let modal: CGFloat = 40  // rounded-[2.5rem] - used in modals
    static let full: CGFloat = 9999 // rounded-full
}
```

### Shadows
```swift
// ios/TripFlow/Shared/DesignSystem/Shadows.swift
import SwiftUI

struct Shadows {
    // Tailwind shadow utilities converted to SwiftUI

    static func sm() -> some View {
        EmptyView()
            .shadow(color: .black.opacity(0.05), radius: 1, x: 0, y: 1)
    }

    static func base() -> some View {
        EmptyView()
            .shadow(color: .black.opacity(0.1), radius: 3, x: 0, y: 1)
            .shadow(color: .black.opacity(0.06), radius: 2, x: 0, y: 1)
    }

    static func md() -> some View {
        EmptyView()
            .shadow(color: .black.opacity(0.1), radius: 6, x: 0, y: 4)
            .shadow(color: .black.opacity(0.06), radius: 3, x: 0, y: 2)
    }

    static func lg() -> some View {
        EmptyView()
            .shadow(color: .black.opacity(0.1), radius: 15, x: 0, y: 10)
            .shadow(color: .black.opacity(0.04), radius: 6, x: 0, y: 4)
    }

    static func xl() -> some View {
        EmptyView()
            .shadow(color: .black.opacity(0.1), radius: 25, x: 0, y: 20)
            .shadow(color: .black.opacity(0.04), radius: 10, x: 0, y: 8)
    }

    static func xl2() -> some View {
        EmptyView()
            .shadow(color: .black.opacity(0.25), radius: 50, x: 0, y: 25)
    }

    // Custom TripFlow shadow (shadow-3xl doesn't exist in Tailwind)
    static func custom3xl() -> some View {
        EmptyView()
            .shadow(color: .black.opacity(0.3), radius: 60, x: 0, y: 30)
    }
}
```

---

## Common Component Conversions

### Gradient Buttons
**Tailwind:**
```tsx
className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl px-6 py-3"
```

**SwiftUI:**
```swift
extension View {
    func primaryGradientButton() -> some View {
        self
            .padding(.horizontal, Spacing.unit6)  // px-6
            .padding(.vertical, Spacing.unit3)    // py-3
            .background(
                LinearGradient(
                    colors: [Color.blue600, Color.purple600],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(BorderRadius.xl2)  // rounded-2xl
    }
}
```

### Modal Backdrop
**Tailwind:**
```tsx
className="fixed inset-0 bg-[#0a0e1a] backdrop-blur-3xl"
```

**SwiftUI:**
```swift
ZStack {
    Color(hex: "#0a0e1a")
        .ignoresSafeArea()
        .blur(radius: 50)  // backdrop-blur-3xl approximation

    // Or use native material:
    // .ultraThinMaterial (better performance)
}
```

### Cards
**Tailwind:**
```tsx
className="bg-white rounded-2xl shadow-md border border-slate-100 p-6"
```

**SwiftUI:**
```swift
extension View {
    func tripCard() -> some View {
        self
            .padding(Spacing.unit6)  // p-6
            .background(Color.white)
            .cornerRadius(BorderRadius.xl2)  // rounded-2xl
            .overlay(
                RoundedRectangle(cornerRadius: BorderRadius.xl2)
                    .stroke(Color.slate100, lineWidth: 1)  // border
            )
            .shadow(color: .black.opacity(0.1), radius: 6, y: 4)  // shadow-md
    }
}
```

---

## Xcode Project Setup & Modularization

### Modern Project Structure (Xcode 16)

TripFlow will use a **modular architecture with Swift Package Manager (SPM)** for better build times, maintainability, and code reuse.

**Recommended Structure:**
```
TripFlow/
├── ios/
│   ├── TripFlow.xcodeproj          # Main Xcode project
│   ├── TripFlow/                   # App target
│   │   ├── TripFlowApp.swift       # App entry point
│   │   ├── Info.plist
│   │   ├── Assets.xcassets
│   │   └── PrivacyInfo.xcprivacy   # Required privacy manifest
│   └── Packages/                   # Local Swift packages
│       └── TripFlowKit/
│           ├── Package.swift
│           └── Sources/
│               ├── DesignSystem/   # Design tokens, view modifiers
│               ├── Core/           # Business logic, models
│               ├── Network/        # Supabase client, API calls
│               ├── Features/       # Feature modules
│               │   ├── Auth/
│               │   ├── Trips/
│               │   ├── Budget/
│               │   └── Team/
│               └── Shared/         # Utilities, extensions
```

### Swift Package Manager Best Practices

**Benefits:**
- **40% faster build times** - Only changed modules recompile
- **Strong boundaries** - Enforced encapsulation and separation of concerns
- **Reusability** - Modules can be shared across targets (iOS, watchOS, widgets)
- **Clear dependencies** - Package.swift explicitly defines module relationships

**Package.swift Structure:**
```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "TripFlowKit",
    platforms: [.iOS(.v17)], // Target iOS 17+ for @Observable
    products: [
        .library(name: "DesignSystem", targets: ["DesignSystem"]),
        .library(name: "Core", targets: ["Core"]),
        .library(name: "Network", targets: ["Network"]),
        .library(name: "Features", targets: ["Features"])
    ],
    dependencies: [
        .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0")
    ],
    targets: [
        .target(
            name: "DesignSystem",
            dependencies: []
        ),
        .target(
            name: "Core",
            dependencies: ["DesignSystem"]
        ),
        .target(
            name: "Network",
            dependencies: [
                "Core",
                .product(name: "Supabase", package: "supabase-swift")
            ]
        ),
        .target(
            name: "Features",
            dependencies: ["Core", "Network", "DesignSystem"]
        )
    ]
)
```

**Key Principles:**
- **Single Responsibility** - Each module has one clear purpose
- **Loose Coupling** - Modules depend on abstractions, not implementations
- **Centralized Dependencies** - Use computed properties for target management
- **Layered Architecture** - DesignSystem → Core → Network → Features

**References:**
- [Local SPM Part 2 - Mastering Modularization with Swift Package Manager (Xcode 15/16)](https://medium.com/@guycohendev/local-spm-part-2-mastering-modularization-with-swift-package-manager-xcode-15-16-d5a11ddd166c)
- [How to modularize projects with Swift Package Manager](https://decode.agency/article/project-modularization-swift-package-manager/)
- [Modularizing iOS Applications with SwiftUI and Swift Package Manager](https://nimblehq.co/blog/modern-approach-modularize-ios-swiftui-spm)

---

## App Store Requirements & Privacy

### Privacy Manifest (Required)

**Critical:** Starting May 1, 2024, all iOS apps **must include a Privacy Manifest** (`PrivacyInfo.xcprivacy`) or face App Store rejection.

**Required Components:**

1. **NSPrivacyTracking** (Boolean)
   - Set to `true` if app tracks users for advertising
   - Requires App Tracking Transparency (ATT) consent prompt

2. **NSPrivacyTrackingDomains** (Array of Strings)
   - List all domains used for tracking (analytics, ads)
   - Example: `["analytics.google.com", "facebook.com"]`

3. **NSPrivacyCollectedDataTypes** (Array)
   - Declare all data collected: email, location, usage data, etc.
   - Must match App Store Connect privacy details

4. **NSPrivacyAccessedAPITypes** (Array)
   - Required reason APIs: UserDefaults, file timestamps, disk space
   - Must provide valid reasons for accessing these APIs

**TripFlow-Specific Privacy Manifest:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>  <!-- Not using tracking -->

    <key>NSPrivacyTrackingDomains</key>
    <array/>  <!-- No tracking domains -->

    <key>NSPrivacyCollectedDataTypes</key>
    <array>
        <dict>
            <key>NSPrivacyCollectedDataType</key>
            <string>NSPrivacyCollectedDataTypeEmailAddress</string>
            <key>NSPrivacyCollectedDataTypeLinked</key>
            <true/>
            <key>NSPrivacyCollectedDataTypeTracking</key>
            <false/>
            <key>NSPrivacyCollectedDataTypePurposes</key>
            <array>
                <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
            </array>
        </dict>
        <!-- Add other data types: photos, location if used -->
    </array>

    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>  <!-- Access app's own data -->
            </array>
        </dict>
    </array>
</dict>
</plist>
```

### App Tracking Transparency (ATT)

**When Required:**
- If using analytics that track across apps/websites
- If sharing user data with third parties for advertising
- If using any tracking SDKs (Firebase Analytics, Mixpanel, etc.)

**Implementation:**
```swift
import AppTrackingTransparency

// Request tracking permission (iOS 14.5+)
func requestTrackingAuthorization() async {
    let status = await ATTrackingManager.requestTrackingAuthorization()
    switch status {
    case .authorized:
        // User consented - enable analytics
        print("Tracking authorized")
    case .denied, .restricted, .notDetermined:
        // Disable tracking features
        print("Tracking denied")
    @unknown default:
        break
    }
}
```

**Add to Info.plist:**
```xml
<key>NSUserTrackingUsageDescription</key>
<string>We use tracking data to improve our services and provide personalized content.</string>
```

### Sign in with Apple

**When Required:**
- If offering Google OAuth, must also offer Sign in with Apple (App Store requirement)
- Can skip if only using email/password or magic links

**Implementation:** Use Supabase Swift SDK's built-in Sign in with Apple support

**References:**
- [Adding a privacy manifest to your app](https://developer.apple.com/documentation/bundleresources/adding-a-privacy-manifest-to-your-app-or-third-party-sdk)
- [Privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files)
- [Privacy updates for App Store submissions](https://developer.apple.com/news/?id=3d8a9yyh)
- [Apple's Privacy Manifest Requirement](https://capgo.app/blog/privacy-manifest-for-ios-apps/)

---

## CI/CD Pipeline

### Option A: Xcode Cloud (Recommended for Solo/Small Teams)

**Pros:**
- ✅ Built into Xcode and App Store Connect
- ✅ 25 free compute hours/month with Apple Developer membership
- ✅ Minimal setup - configure directly in Xcode
- ✅ Automatic TestFlight distribution
- ✅ Perfect for iOS-only projects

**Cons:**
- ❌ Less customization than Fastlane
- ❌ Limited to Apple ecosystem
- ❌ Additional hours cost extra

**Setup Steps:**
1. Open Xcode → Product → Xcode Cloud → Create Workflow
2. Connect GitHub repository
3. Configure build triggers (on push to `main`, PRs)
4. Set up TestFlight distribution
5. Add test notes from `TestFlight/WhatToTest.en.txt`

**Cost:** $0/month for first 25 hours, then $50-$100/month for additional hours

**Best For:** TripFlow (solo developer, iOS-only, simple workflow)

### Option B: Fastlane + GitHub Actions (Advanced)

**Pros:**
- ✅ Complete customization and control
- ✅ Cross-platform support (iOS + Android)
- ✅ Extensive plugin ecosystem
- ✅ Free for open-source projects on GitHub
- ✅ Works with any CI provider

**Cons:**
- ❌ More complex setup (provisioning profiles, certificates)
- ❌ Requires DevOps expertise
- ❌ macOS runners cost 10x GitHub Actions minutes ($0.08/min)

**GitHub Actions Workflow Example:**
```yaml
# .github/workflows/ios-deploy.yml
name: iOS Deploy to TestFlight

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: macos-14  # Xcode 16 support

    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: |
          brew install fastlane
          bundle install

      - name: Build and deploy to TestFlight
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APP_STORE_CONNECT_API_KEY: ${{ secrets.ASC_API_KEY }}
        run: |
          fastlane beta
```

**Fastlane Configuration (`Fastfile`):**
```ruby
default_platform(:ios)

platform :ios do
  desc "Deploy to TestFlight"
  lane :beta do
    increment_build_number(xcodeproj: "TripFlow.xcodeproj")
    build_app(scheme: "TripFlow", export_method: "app-store")
    upload_to_testflight(skip_waiting_for_build_processing: true)
  end
end
```

**Cost:** ~$2.40 per build (30 min × $0.08/min) on private GitHub repos

**Best For:** Teams with DevOps expertise, multi-platform projects, complex workflows

### Recommendation for TripFlow

**Use Xcode Cloud** because:
- Solo developer workflow
- iOS-only project (no Android)
- 25 free hours covers ~50 builds/month
- Simpler setup and maintenance
- Native integration with TestFlight

**Consider Fastlane later** if:
- Building Android version
- Needing advanced customization
- Running open-source on GitHub (free)

**References:**
- [How to set up a CI/CD pipeline for your iOS app using fastlane and GitHub Actions](https://www.runway.team/blog/how-to-set-up-a-ci-cd-pipeline-for-your-ios-app-fastlane-github-actions)
- [Deploy iOS App to TestFlight with GitHub Actions & Fastlane](https://medium.com/swiftable/build-and-deploy-the-app-to-testflight-using-github-actions-with-fastlane-and-app-distribution-ff1786a8bf72)
- [Mobile CI/CD in a Day: GitHub Actions + Fastlane + App Center (2025 Guide)](https://developersvoice.com/blog/mobile/mobile-cicd-blueprint/)
- [Xcode Cloud Overview](https://developer.apple.com/xcode-cloud/)

---

## Migration Tracking

### Phase 1: Foundation ✅
- [x] Research Swift/SwiftUI best practices
- [x] Research Supabase Swift SDK
- [x] Determine project structure
- [x] Extract design tokens from Tailwind config
- [ ] Create iOS folder structure
- [ ] Set up Xcode project
- [ ] Install dependencies (Supabase Swift SDK)
- [ ] Create Design System Swift files

### Phase 2: Design System 🚧
- [ ] Create `Colors.swift` with all Tailwind color tokens
- [ ] Create `Typography.swift` with custom fonts
- [ ] Create `Spacing.swift` with Tailwind spacing scale
- [ ] Create `BorderRadius.swift` with custom radii
- [ ] Create `Shadows.swift` with shadow utilities
- [ ] Create custom view modifiers for common patterns:
  - [ ] `.primaryButton()`
  - [ ] `.secondaryButton()`
  - [ ] `.tripCard()`
  - [ ] `.modalContainer()`
  - [ ] `.inputField()`

### Phase 3: Authentication 📋
- [ ] Google OAuth sign-in
- [ ] Magic link email authentication
- [ ] Session management with @Observable
- [ ] Profile view
- [ ] Sign out functionality

### Phase 4: Core Features 📋
- [ ] Trip List/Dashboard
  - [ ] Grid layout
  - [ ] Trip cards matching web design
  - [ ] Pull-to-refresh
  - [ ] Search
- [ ] Trip Detail View
  - [ ] Tab navigation
  - [ ] Header with cover image
- [ ] Itinerary Tab
  - [ ] Activity list
  - [ ] Add/edit/delete activities
  - [ ] Time/location display
- [ ] Budget Tab
  - [ ] Expense tracking
  - [ ] Charts (Swift Charts)
  - [ ] Category breakdown
- [ ] Packing Tab
  - [ ] Checklist
  - [ ] Categories
- [ ] Documents Tab
  - [ ] File upload
  - [ ] PDF viewer
- [ ] Team Tab
  - [ ] Member list
  - [ ] Invite functionality
  - [ ] Role management

### Phase 5: Advanced Features 📋
- [ ] Real-time sync (Supabase Realtime)
- [ ] Offline support (SwiftData)
- [ ] Push notifications
- [ ] Widgets
- [ ] Siri Shortcuts

### Phase 6: Polish 📋
- [ ] Accessibility (VoiceOver)
- [ ] Dynamic Type support
- [ ] Haptic feedback
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Testing

---

## Component Mapping

Complete reference of web components → Swift components:

| Web Component | SwiftUI Equivalent | Notes |
|---------------|-------------------|-------|
| `<div>` | `VStack`, `HStack`, `ZStack` | Flexbox → Stack views |
| `<button>` | `Button` | Native button with custom styling |
| `<input>` | `TextField` | Text input |
| `<img>` | `AsyncImage` | Async image loading built-in |
| `<p>`, `<span>` | `Text` | Text display |
| `className=""` | View modifiers | `.background()`, `.padding()`, etc. |
| React `useState` | `@State` | Local state |
| React `useEffect` | `.onAppear`, `.task` | Lifecycle |
| CSS `flex` | `HStack`, `VStack` | Stack layouts |
| CSS `grid` | `LazyVGrid`, `LazyHGrid` | Grid layouts |
| CSS `position: fixed` | `ZStack` with `.ignoresSafeArea()` | Overlays |
| CSS gradients | `LinearGradient`, `RadialGradient` | Native gradients |
| CSS `backdrop-filter` | `.blur()`, `.ultraThinMaterial` | Native blur |

---

## Resources

- [Tailwind Config](/tailwind.config.ts) - Source of truth for design tokens
- [Supabase Swift SDK](https://github.com/supabase/supabase-swift)
- [SwiftUI Documentation](https://developer.apple.com/documentation/swiftui/)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

---

**Last Updated:** 2026-01-04
**Next Review:** After Phase 1 completion
