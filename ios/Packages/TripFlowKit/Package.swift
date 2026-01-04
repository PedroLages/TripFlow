// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "TripFlowKit",
    platforms: [
        .iOS(.v17)  // Target iOS 17+ for @Observable framework
    ],
    products: [
        // Products define the executables and libraries a package produces, making them visible to other packages.
        .library(
            name: "DesignSystem",
            targets: ["DesignSystem"]
        ),
        .library(
            name: "Core",
            targets: ["Core"]
        ),
        .library(
            name: "Network",
            targets: ["Network"]
        ),
        .library(
            name: "Features",
            targets: ["Features"]
        ),
        .library(
            name: "Shared",
            targets: ["Shared"]
        )
    ],
    dependencies: [
        // Dependencies declare other packages that this package depends on.
        .package(url: "https://github.com/supabase/supabase-swift", from: "2.0.0")
    ],
    targets: [
        // Targets are the basic building blocks of a package, defining a module or a test suite.
        // Targets can depend on other targets in this package and products from dependencies.

        // MARK: - DesignSystem (No dependencies)
        .target(
            name: "DesignSystem",
            dependencies: []
        ),

        // MARK: - Core (Depends on DesignSystem)
        .target(
            name: "Core",
            dependencies: ["DesignSystem"]
        ),

        // MARK: - Network (Depends on Core + Supabase)
        .target(
            name: "Network",
            dependencies: [
                "Core",
                .product(name: "Supabase", package: "supabase-swift")
            ]
        ),

        // MARK: - Features (Depends on Core, Network, DesignSystem)
        .target(
            name: "Features",
            dependencies: ["Core", "Network", "DesignSystem"]
        ),

        // MARK: - Shared (Utilities and extensions)
        .target(
            name: "Shared",
            dependencies: ["Core"]
        ),

        // MARK: - Tests
        .testTarget(
            name: "DesignSystemTests",
            dependencies: ["DesignSystem"]
        ),
        .testTarget(
            name: "CoreTests",
            dependencies: ["Core"]
        ),
        .testTarget(
            name: "NetworkTests",
            dependencies: ["Network"]
        ),
        .testTarget(
            name: "FeaturesTests",
            dependencies: ["Features"]
        )
    ]
)
