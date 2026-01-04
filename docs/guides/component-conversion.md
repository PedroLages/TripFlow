# Component Conversion Reference

> Side-by-side comparison of TripFlow web components and their SwiftUI equivalents

## Overview

This document shows how each major component from the web app will be implemented in SwiftUI, preserving the exact visual design while using native iOS patterns.

---

## Team Invitation Modal

### Web Implementation (React + Tailwind)
```tsx
// components/TeamManagement.tsx
{inviteModalOpen && (
  <div className="fixed inset-0 z-[1002] bg-[#0a0e1a] backdrop-blur-3xl animate-in fade-in duration-200 md:flex md:items-center md:justify-center">
    <div className="absolute inset-0 md:relative bg-white dark:bg-[#161b28] w-full md:max-w-lg shadow-3xl overflow-hidden animate-in zoom-in duration-300 flex flex-col md:h-auto md:rounded-[2.5rem]">

      {/* Header */}
      <div className="p-6 sm:p-8 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              Invite Team Member
            </h3>
            <p className="text-sm text-slate-500">Send invitation via email</p>
          </div>
        </div>
        <button onClick={() => setInviteModalOpen(false)} className="w-10 h-10 hover:bg-slate-200 rounded-xl">
          <XCircle size={20} />
        </button>
      </div>

      {/* Content */}
      <form onSubmit={handleSendInvitation} className="p-6 sm:p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 rounded-2xl border-2 border-slate-200"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button type="button" className="px-6 py-3 bg-slate-100 rounded-2xl">
            Cancel
          </button>
          <button type="submit" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl">
            Send Invitation
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

### SwiftUI Implementation
```swift
// Features/Team/Views/InviteTeamMemberSheet.swift
import SwiftUI

struct InviteTeamMemberSheet: View {
    @Environment(\.dismiss) var dismiss
    @State private var inviteEmail = ""
    @State private var inviteRole: UserRole = .viewer
    @State private var isSending = false

    var onSend: (String, UserRole) async -> Void

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: Spacing.unit2) {
                        HStack(spacing: Spacing.unit2) {
                            Image(systemName: "envelope")
                                .font(.system(size: 14))
                                .foregroundStyle(Color.slate700)
                            Text("Email Address")
                                .font(Typography.footnote.weight(.semibold))
                                .foregroundStyle(Color.slate700)
                        }

                        TextField("colleague@example.com", text: $inviteEmail)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                            .padding(Spacing.unit3)
                            .background(Color.slate50)
                            .cornerRadius(BorderRadius.xl2)
                            .overlay(
                                RoundedRectangle(cornerRadius: BorderRadius.xl2)
                                    .stroke(Color.slate200, lineWidth: 2)
                            )
                    }
                }
                .listRowBackground(Color.clear)

                Section {
                    Picker("Permission Level", selection: $inviteRole) {
                        ForEach(UserRole.allCases, id: \.self) { role in
                            HStack {
                                role.icon
                                Text(role.displayName)
                            }
                            .tag(role)
                        }
                    }
                    .pickerStyle(.inline)
                }

                Section {
                    HStack {
                        Spacer()

                        Button("Cancel") {
                            dismiss()
                        }
                        .buttonStyle(.bordered)
                        .tint(Color.slate500)

                        Button {
                            Task {
                                isSending = true
                                await onSend(inviteEmail, inviteRole)
                                isSending = false
                                dismiss()
                            }
                        } label: {
                            if isSending {
                                ProgressView()
                                    .progressViewStyle(.circular)
                            } else {
                                HStack(spacing: Spacing.unit2) {
                                    Image(systemName: "paperplane.fill")
                                    Text("Send Invitation")
                                }
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(
                            LinearGradient(
                                colors: [Color.blue600, Color.purple600],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .disabled(isSending || inviteEmail.isEmpty)
                    }
                }
                .listRowBackground(Color.clear)
            }
            .scrollContentBackground(.hidden)
            .background(Color(UIColor.systemGroupedBackground))
            .navigationTitle("Invite Team Member")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }
}

// Preview
#Preview {
    InviteTeamMemberSheet { email, role in
        print("Sending invite to \(email) as \(role)")
    }
}
```

**Key Differences:**
- **Modal presentation**: `.sheet()` instead of fixed overlay
- **Form fields**: `Form` + `Section` for iOS-native feel
- **Dismissal**: Environment `.dismiss` instead of state toggle
- **Async actions**: `Task {}` for async/await
- **Native patterns**: `presentationDetents()`, `presentationDragIndicator()`

---

## Trip Card Component

### Web Implementation
```tsx
// components/Dashboard.tsx
<div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer">
  <div className="relative h-48">
    <img
      src={trip.coverImage}
      alt={trip.name}
      className="w-full h-full object-cover"
    />
    <div className="absolute top-3 right-3">
      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold">
        {trip.status}
      </span>
    </div>
  </div>

  <div className="p-6">
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
      {trip.name}
    </h3>
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <MapPin size={16} />
      <span>{trip.destination}</span>
    </div>
    <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
      <Calendar size={16} />
      <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
    </div>
  </div>
</div>
```

### SwiftUI Implementation
```swift
// Features/Trips/Views/TripCard.swift
import SwiftUI

struct TripCard: View {
    let trip: Trip

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Cover Image
            AsyncImage(url: URL(string: trip.coverImage ?? "")) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                case .failure:
                    Color.slate200
                        .overlay {
                            Image(systemName: "photo")
                                .font(.largeTitle)
                                .foregroundStyle(Color.slate400)
                        }
                case .empty:
                    Color.slate200
                        .overlay {
                            ProgressView()
                        }
                @unknown default:
                    EmptyView()
                }
            }
            .frame(height: 192) // h-48 = 12rem = 192px
            .clipped()
            .overlay(alignment: .topTrailing) {
                // Status Badge
                Text(trip.status.displayName)
                    .font(Typography.caption.weight(.semibold))
                    .padding(.horizontal, Spacing.unit3)
                    .padding(.vertical, Spacing.unit1)
                    .background(.ultraThinMaterial)
                    .cornerRadius(BorderRadius.full)
                    .padding(Spacing.unit3)
            }

            // Content
            VStack(alignment: .leading, spacing: Spacing.unit2) {
                Text(trip.name)
                    .font(Typography.title3)
                    .foregroundStyle(Color.slate900)
                    .lineLimit(1)

                HStack(spacing: Spacing.unit2) {
                    Image(systemName: "mappin.circle.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(Color.slate500)
                    Text(trip.destination)
                        .font(Typography.subheadline)
                        .foregroundStyle(Color.slate500)
                }

                HStack(spacing: Spacing.unit2) {
                    Image(systemName: "calendar")
                        .font(.system(size: 16))
                        .foregroundStyle(Color.slate500)
                    Text("\(trip.startDate.formatted(date: .abbreviated, time: .omitted)) - \(trip.endDate.formatted(date: .abbreviated, time: .omitted))")
                        .font(Typography.subheadline)
                        .foregroundStyle(Color.slate500)
                }
            }
            .padding(Spacing.unit6) // p-6
        }
        .background(Color.white)
        .cornerRadius(BorderRadius.xl2) // rounded-2xl
        .overlay(
            RoundedRectangle(cornerRadius: BorderRadius.xl2)
                .stroke(Color.slate100, lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.1), radius: 6, y: 4) // shadow-md
    }
}

// Preview
#Preview {
    TripCard(trip: Trip.preview)
        .padding()
}
```

**Key Differences:**
- **Image loading**: `AsyncImage` with loading states
- **Layout**: `VStack` instead of div stacking
- **Icons**: SF Symbols (`mappin.circle.fill`) instead of Lucide
- **Date formatting**: Swift `.formatted()` instead of date-fns
- **Material**: `.ultraThinMaterial` for native iOS blur

---

## Primary Button Component

### Web Implementation
```tsx
<button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-medium text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all">
  <Plus size={16} />
  Invite Member
</button>
```

### SwiftUI Implementation
```swift
// Shared/DesignSystem/ButtonStyles.swift
import SwiftUI

struct PrimaryGradientButtonStyle: ButtonStyle {
    @State private var isPressed = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Typography.subheadline.weight(.semibold))
            .foregroundStyle(.white)
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
            .shadow(
                color: .black.opacity(configuration.isPressed ? 0.3 : 0.2),
                radius: configuration.isPressed ? 15 : 10,
                y: 5
            )
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.spring(response: 0.3), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == PrimaryGradientButtonStyle {
    static var primaryGradient: PrimaryGradientButtonStyle {
        PrimaryGradientButtonStyle()
    }
}

// Usage:
Button {
    // action
} label: {
    HStack(spacing: Spacing.unit2) {
        Image(systemName: "plus")
            .font(.system(size: 16))
        Text("Invite Member")
    }
}
.buttonStyle(.primaryGradient)
```

---

## Text Input Field

### Web Implementation
```tsx
<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="colleague@example.com"
  className="w-full px-4 py-3 bg-slate-50 rounded-2xl outline-none border-2 border-slate-200 focus:border-blue-500 transition-all text-sm font-medium"
/>
```

### SwiftUI Implementation
```swift
// Shared/DesignSystem/TextFieldStyles.swift
import SwiftUI

struct TripFlowTextFieldStyle: TextFieldStyle {
    @FocusState private var isFocused: Bool

    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .font(Typography.subheadline.weight(.medium))
            .padding(Spacing.unit3)  // py-3
            .padding(.horizontal, Spacing.unit4)  // px-4
            .background(Color.slate50)
            .cornerRadius(BorderRadius.xl2)  // rounded-2xl
            .overlay(
                RoundedRectangle(cornerRadius: BorderRadius.xl2)
                    .stroke(isFocused ? Color.blue500 : Color.slate200, lineWidth: 2)
            )
            .focused($isFocused)
            .animation(.easeInOut(duration: 0.2), value: isFocused)
    }
}

extension TextFieldStyle where Self == TripFlowTextFieldStyle {
    static var tripFlow: TripFlowTextFieldStyle {
        TripFlowTextFieldStyle()
    }
}

// Usage:
TextField("colleague@example.com", text: $email)
    .textFieldStyle(.tripFlow)
    .textInputAutocapitalization(.never)
    .keyboardType(.emailAddress)
```

---

## Navigation Bar (Mobile Bottom Nav)

### Web Implementation
```tsx
// components/MobileNav.tsx
<nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 md:hidden">
  <div className="flex justify-around items-center h-16">
    <button className={`flex flex-col items-center gap-1 ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
      <Home size={24} />
      <span className="text-xs">Home</span>
    </button>
    {/* ... other nav items */}
  </div>
</nav>
```

### SwiftUI Implementation
```swift
// App/MainTabView.swift
import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)

            TripsListView()
                .tabItem {
                    Label("Trips", systemImage: "airplane")
                }
                .tag(1)

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(2)
        }
        .tint(Color.blue600)  // Active tab color
    }
}
```

**Key Differences:**
- **TabView**: Native iOS tab bar (no need to implement custom)
- **Automatic behavior**: iOS handles tab switching, badge counts, etc.
- **System icons**: SF Symbols instead of Lucide icons

---

## Quick Reference Table

| Web Pattern | Tailwind Class | SwiftUI Equivalent | Notes |
|-------------|----------------|-------------------|-------|
| Container | `bg-white rounded-2xl shadow-md` | `.background(Color.white).cornerRadius(16).shadow(...)` | |
| Gradient | `bg-gradient-to-r from-blue-600 to-purple-600` | `LinearGradient(colors: [.blue600, .purple600], ...)` | |
| Flex Row | `flex items-center gap-3` | `HStack(spacing: 12)` | gap-3 = 12px |
| Flex Col | `flex flex-col space-y-4` | `VStack(spacing: 16)` | space-y-4 = 16px |
| Padding | `px-6 py-3` | `.padding(.horizontal, 24).padding(.vertical, 12)` | px-6 = 24px, py-3 = 12px |
| Backdrop Blur | `backdrop-blur-3xl` | `.blur(radius: 50)` or `.ultraThinMaterial` | Native materials preferred |
| Hover Effect | `hover:scale-105` | `.scaleEffect(isPressed ? 1.05 : 1.0)` | Use button states |
| Text Color | `text-slate-900` | `.foregroundStyle(Color.slate900)` | |
| Font Weight | `font-semibold` | `.weight(.semibold)` | |
| Border | `border-2 border-slate-200` | `.overlay(RoundedRectangle(...).stroke(...))` | |

---

**Last Updated:** 2026-01-04
**Maintained By:** TripFlow iOS Team
