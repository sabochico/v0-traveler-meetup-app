// swift-tools-version: 5.9
import PackageDescription

// DO NOT MODIFY THIS FILE - managed by Capacitor CLI commands
let package = Package(
    name: "CapApp-SPM",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CapApp-SPM",
            targets: ["CapApp-SPM"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", exact: "8.3.4"),
        .package(name: "CapacitorApp", path: "..\..\..\node_modules\.pnpm\@capacitor+app@8.1.0_@capacitor+core@8.3.4\node_modules\@capacitor\app"),
        .package(name: "CapacitorHaptics", path: "..\..\..\node_modules\.pnpm\@capacitor+haptics@8.0.2_@capacitor+core@8.3.4\node_modules\@capacitor\haptics"),
        .package(name: "CapawesomeCapacitorAppleSignIn", path: "..\..\..\node_modules\.pnpm\@capawesome+capacitor-apple_8d7f7de8f048246ef69f934c1e1c0a91\node_modules\@capawesome\capacitor-apple-sign-in")
    ],
    targets: [
        .target(
            name: "CapApp-SPM",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "CapacitorApp", package: "CapacitorApp"),
                .product(name: "CapacitorHaptics", package: "CapacitorHaptics"),
                .product(name: "CapawesomeCapacitorAppleSignIn", package: "CapawesomeCapacitorAppleSignIn")
            ]
        )
    ]
)
