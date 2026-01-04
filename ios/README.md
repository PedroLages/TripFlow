# TripFlow iOS App

> Native iOS implementation of TripFlow using Swift, SwiftUI, and Supabase

## 📋 Current Status

✅ **Completed:**
- Folder structure created
- Swift Package Manager (`TripFlowKit`) configured
- Privacy Manifest created (App Store compliant)
- Initial Swift files created
- Design System colors extracted from Tailwind

🚧 **Next Steps:**
- Create Xcode project (`.xcodeproj`)
- Link local Swift Package to Xcode project
- Configure app identity and signing
- Implement authentication with Supabase

---

## 🚀 Xcode Project Setup

### Prerequisites

- **Mac with macOS 14+** (Sonoma or later)
- **Xcode 16+** (for iOS 17+ support)
- **Apple Developer Account** (for device testing and App Store submission)
- **Supabase Project** (already set up for TripFlow web app)

### Step 1: Create Xcode Project

1. **Open Xcode**
2. **File → New → Project**
3. Select **iOS → App**
4. Click **Next**

5. **Configure Project:**
   - **Product Name:** `TripFlow`
   - **Team:** Select your Apple Developer team
   - **Organization Identifier:** `com.yourdomain` (use your actual domain)
   - **Bundle Identifier:** Will auto-generate as `com.yourdomain.TripFlow`
   - **Interface:** SwiftUI
   - **Language:** Swift
   - **Storage:** None (we'll use Supabase)
   - **Include Tests:** ✅ Checked

6. **Save Location:**
   - Navigate to `/Volumes/SSD/Dev/TripFlow/ios/`
   - Click **Create**
   - ⚠️ **IMPORTANT:** When asked "Create Git repository", click **No** (we already have one in the parent folder)

### Step 2: Configure Deployment Target

1. Select **TripFlow** project in navigator
2. Under **Targets → TripFlow**
3. **General** tab
4. Set **Minimum Deployments:** iOS 17.0

### Step 3: Add Local Swift Package

1. Select **TripFlow** project
2. **Project Settings → Package Dependencies** tab
3. Click **+** (Add Package)
4. Click **Add Local...**
5. Navigate to `ios/Packages/TripFlowKit/`
6. Click **Add Package**
7. In "Add to Target" dialog, select **TripFlow** and click **Add Package**

### Step 4: Move Existing Files into Xcode Project

The following files were pre-created and need to be added to your Xcode project:

1. **Delete Xcode's default files:**
   - Right-click `ContentView.swift` (Xcode-generated) → Delete → **Move to Trash**
   - Right-click `TripFlowApp.swift` (Xcode-generated) → Delete → **Move to Trash**

2. **Add our pre-created files:**
   - In Finder, navigate to `ios/TripFlow/`
   - Drag these files into Xcode's `TripFlow` group:
     - `TripFlowApp.swift` ✅
     - `ContentView.swift` ✅
     - `PrivacyInfo.xcprivacy` ✅
   - When prompted:
     - ✅ **Copy items if needed:** NO (files are already in place)
     - ✅ **Added folders:** "Create groups"
     - ✅ **Add to targets:** Select "TripFlow"

### Step 5: Configure Info.plist

1. Select **TripFlow** target
2. **Info** tab
3. Add the following keys:

**Custom iOS Target Properties:**
```
Supports multiple windows: NO
Launch screen: (leave empty - we'll use SwiftUI)
```

**If using Google OAuth (requires Sign in with Apple too):**
```
URL Types → Add new
  - Identifier: com.yourdomain.TripFlow
  - URL Schemes: tripflow

Privacy - Tracking Usage Description:
  "We use tracking data to improve our services and provide personalized content."
```

### Step 6: Link Swift Package Modules

1. Select **TripFlow** target
2. **General** tab → **Frameworks, Libraries, and Embedded Content**
3. Click **+**
4. Add these modules from `TripFlowKit`:
   - `DesignSystem`
   - `Core`
   - `Network`
   - `Features`
   - `Shared`

### Step 7: Build and Run

1. Select a simulator: **iPhone 15 Pro** (or any iOS 17+ device)
2. Press **⌘R** or click **Play** button
3. You should see the TripFlow splash screen with status indicators

---

## 📦 Package Structure

```
TripFlowKit/
├── Package.swift                 # Package manifest
└── Sources/
    ├── DesignSystem/             # Colors, Typography, Spacing, etc.
    │   └── Colors.swift          ✅ Created
    ├── Core/                     # Models, Business Logic
    │   ├── Models/               (To be created)
    │   └── Services/             (To be created)
    ├── Network/                  # Supabase client, API calls
    │   ├── SupabaseClient.swift  (To be created)
    │   └── AuthService.swift     (To be created)
    ├── Features/                 # Feature modules
    │   ├── Auth/                 (To be created)
    │   ├── Trips/                (To be created)
    │   ├── Budget/               (To be created)
    │   └── Team/                 (To be created)
    └── Shared/                   # Utilities, Extensions
        └── Extensions/           (To be created)
```

---

## 🔐 Supabase Configuration

### Install Supabase Swift SDK

The SDK is already declared in `Package.swift`. When you build the project, Swift Package Manager will automatically download and integrate it.

### Configure Supabase Client

Create `ios/Packages/TripFlowKit/Sources/Network/SupabaseClient.swift`:

```swift
import Supabase

public final class SupabaseService {
    public static let shared = SupabaseService()

    public let client: SupabaseClient

    private init() {
        // Get these from your Supabase project settings
        let supabaseURL = "https://xnmbvjlhwrukliuzhhvf.supabase.co"
        let supabaseKey = "YOUR_SUPABASE_ANON_KEY"  // Replace with actual key

        client = SupabaseClient(
            supabaseURL: URL(string: supabaseURL)!,
            supabaseKey: supabaseKey
        )
    }
}
```

⚠️ **Security Note:** Store the Supabase key securely:
- For development: Use a `Config.plist` file (add to `.gitignore`)
- For production: Use Xcode's build configurations

---

## 📱 Next Development Tasks

### Phase 1: Authentication (1-2 days)
- [ ] Create `AuthService.swift` with Supabase authentication
- [ ] Implement Google OAuth flow
- [ ] Add Sign in with Apple (required for App Store)
- [ ] Create login/signup screens matching web design
- [ ] Add session management with `@Observable`

### Phase 2: Design System (1-2 days)
- [ ] Complete `Typography.swift` (Space Grotesk + Plus Jakarta Sans fonts)
- [ ] Create `Spacing.swift` with Tailwind spacing scale
- [ ] Create `BorderRadius.swift`
- [ ] Create custom view modifiers (`.tripCard()`, `.primaryButton()`, etc.)

### Phase 3: Core Features (2-3 weeks)
- [ ] Trip list/dashboard
- [ ] Trip detail view with tabs
- [ ] Itinerary management
- [ ] Budget tracking with Swift Charts
- [ ] Team collaboration
- [ ] Document storage with Supabase Storage

---

## 🔗 Documentation References

- **Migration Guide:** [`/docs/guides/ios-migration.md`](../docs/guides/ios-migration.md)
- **Component Conversion:** [`/docs/guides/component-conversion.md`](../docs/guides/component-conversion.md)
- **Supabase Swift SDK:** https://github.com/supabase/supabase-swift
- **SwiftUI Documentation:** https://developer.apple.com/documentation/swiftui

---

## 🐛 Troubleshooting

### "Cannot find 'SupabaseClient' in scope"
- Build the project (⌘B) to download Swift Package dependencies
- Clean build folder (⌘⇧K) and rebuild

### "Privacy manifest not found"
- Ensure `PrivacyInfo.xcprivacy` is in the TripFlow target (not just the folder)
- Check **Target Membership** in File Inspector

### Package resolution fails
- Check internet connection
- File → Packages → Reset Package Caches
- File → Packages → Update to Latest Package Versions

---

**Last Updated:** 2026-01-04
**iOS Version:** 17.0+
**Xcode Version:** 16.0+
