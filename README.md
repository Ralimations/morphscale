# MorphScale

MorphScale is a mobile-first visual fitness progress tracker. It helps users log body weight, capture progress photos with alignment assistance, review history, and generate visual transformation comparisons over time.

The app runs as a Vite/React web app, a PWA, and a Capacitor Android app.

## What It Does

- Logs body weight entries with date, unit, BMI, and optional photo.
- Stores logs and photos locally in the browser or Android WebView.
- Uses the device camera to capture body progress photos.
- Shows a ghost overlay from the most recent saved photo so new photos can be aligned more consistently.
- Provides a dashboard with current weight, total weight lost, BMI, target progress, trend chart, and milestones.
- Shows a history list with saved entries and thumbnails.
- Creates a photo time-lapse from progress photos.
- Exports the time-lapse as a WebM video when supported by the browser/WebView.
- Creates before/after side-by-side comparisons.
- Downloads side-by-side comparisons as PNG images.
- Packages for Android through Capacitor.
- Provides PWA manifest, icons, service worker generation, and installable web-app behavior.

## Technologies Used

- **React 19**: UI component framework.
- **React DOM**: Browser rendering for React.
- **TypeScript**: Static typing for app code.
- **Vite 6**: Development server and production web build.
- **Vite PWA Plugin**: Generates the PWA manifest and service worker.
- **Capacitor 8**: Wraps the web app as a native Android app.
- **Capacitor Android**: Android platform project and native WebView shell.
- **Recharts**: Weight trend chart rendering.
- **Lucide React**: Icon set used throughout the UI.
- **IndexedDB**: Local storage for weight logs and photo blobs.
- **localStorage**: Local storage for app settings.
- **MediaDevices API**: Camera access through `navigator.mediaDevices.getUserMedia`.
- **Canvas API**: Photo capture, comparison image generation, and time-lapse frame rendering.
- **MediaRecorder API**: WebM time-lapse video export.
- **PWA Web APIs**: Manifest, service worker precache, standalone display mode.
- **Android Gradle Plugin / Gradle Wrapper**: Android debug APK builds.
- **Android SDK Platform 36**: Android compile SDK target currently required by the native project.
- **JDK 21**: Java runtime/toolchain for Android builds.

## Project Structure

```text
.
├── App.tsx                         # Main app state, routing, logging modal, settings
├── index.tsx                       # React entry point
├── index.html                      # Web document shell and CDN styles/fonts
├── components/
│   ├── Dashboard.tsx               # Stats, trend chart, milestones
│   ├── Gallery.tsx                 # Time-lapse and side-by-side comparison
│   ├── GhostCamera.tsx             # Camera capture and ghost overlay
│   └── Layout.tsx                  # Mobile shell and bottom navigation
├── services/
│   └── db.ts                       # IndexedDB storage service
├── public/                         # PWA icons and static assets
├── android/                        # Capacitor Android native project
├── capacitor.config.ts             # Capacitor app id/name/webDir
├── vite.config.ts                  # Vite, React, and PWA config
├── package.json                    # npm scripts and dependencies
└── types.ts                        # Shared app types
```

## Requirements

Required for web development:

- Node.js `>=22 <23`
- npm
- A modern browser such as Chrome or Edge

Required for Android development:

- JDK 21
- Android SDK Platform 36
- Android SDK Build Tools 36
- Android SDK Platform Tools / ADB
- Android Studio, Android emulator, or a physical Android device

This workspace also has a local toolchain under `D:\Programming Projects\Tools\morphscale-tools\`:

- Node.js: `D:\Programming Projects\Tools\morphscale-tools\node`
- JDK 21: `D:\Programming Projects\Tools\morphscale-tools\jdk-21`
- Android SDK: `D:\Programming Projects\Tools\morphscale-tools\android-sdk`
- Android Studio: `D:\Programming Projects\Tools\morphscale-tools\android-studio\bin\studio64.exe`

The `morphscale-tools` folder is intentionally outside this repository so Git only has to track source files. `.tools/` is still ignored in case a future local install is created inside the repo by mistake.

## Environment Setup

If Node, Java, and Android SDK are installed globally, normal commands such as `npm` and `npx` should work.

To use the project-local toolchain in PowerShell, run this from the repository root:

```powershell
$env:MORPHSCALE_TOOLS = "D:\Programming Projects\Tools\morphscale-tools"
$env:JAVA_HOME = "$env:MORPHSCALE_TOOLS\jdk-21"
$env:ANDROID_HOME = "$env:MORPHSCALE_TOOLS\android-sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH = "$env:MORPHSCALE_TOOLS\node;$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
```

Then use either `npm`/`npx` if they resolve, or the explicit local commands:

```powershell
& "$env:MORPHSCALE_TOOLS\node\npm.cmd" --version
& "$env:MORPHSCALE_TOOLS\node\npx.cmd" --version
```

## Install Dependencies

With global Node/npm:

```powershell
npm install
```

With the project-local Node:

```powershell
& "$env:MORPHSCALE_TOOLS\node\npm.cmd" install
```

## Run The Web App

Start the Vite development server:

```powershell
npm run dev
```

Using local Node:

```powershell
& "$env:MORPHSCALE_TOOLS\node\npm.cmd" run dev
```

The dev server is configured for:

```text
http://localhost:3000
```

Camera features require browser camera permission. For best results, test camera behavior in Chrome, Edge, Android Chrome, or the Android WebView build.

## Web Testing Checklist

Run TypeScript type-checking:

```powershell
npm run typecheck
```

Build the production PWA/web output:

```powershell
npm run build
```

Preview the production build:

```powershell
npm run preview
```

Manual browser test flow:

1. Open the app at `http://localhost:3000`.
2. Add a first weight entry.
3. Add a photo and allow camera permissions.
4. Confirm the entry appears in History.
5. Add a second photo entry.
6. Confirm the Dashboard updates current weight, BMI, chart, and milestones.
7. Open Morph and test Time-Lapse playback.
8. Export a time-lapse if the browser supports WebM/VP9 recording.
9. Switch to Side-by-Side mode and download a comparison PNG.
10. Use Setup to change height, target weight, and unit.
11. Test Clear All Data only when you are ready to wipe local app data.

Browser storage to inspect while debugging:

- IndexedDB database: `morphscale_db`
- IndexedDB object stores: `logs`, `photos`
- localStorage key: `morphscale_settings`

## Android Build And Test

Build the web app first because Capacitor copies `dist/` into the Android project:

```powershell
npm run build
npx cap sync android
```

Using local Node:

```powershell
& "$env:MORPHSCALE_TOOLS\node\npm.cmd" run build
& "$env:MORPHSCALE_TOOLS\node\npx.cmd" cap sync android
```

Open Android Studio:

```powershell
npx cap open android
```

Using the project-local Android Studio:

```powershell
& "$env:MORPHSCALE_TOOLS\android-studio\bin\studio64.exe"
```

Build a debug APK from PowerShell:

```powershell
Set-Location android
.\gradlew.bat assembleDebug
```

The APK is written to:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on a connected Android device:

```powershell
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

If using the local SDK directly:

```powershell
& "$env:MORPHSCALE_TOOLS\android-sdk\platform-tools\adb.exe" install -r android\app\build\outputs\apk\debug\app-debug.apk
```

Check connected devices:

```powershell
adb devices
```

View Android logs:

```powershell
adb logcat
```

## Android Manual Test Flow

1. Install the debug APK on a physical device or emulator.
2. Launch MorphScale.
3. Grant camera permission.
4. Create a weight log with a photo.
5. Create a second weight log and confirm the ghost overlay appears in the camera.
6. Check History thumbnails.
7. Check Dashboard stats and chart.
8. Test Time-Lapse playback and export.
9. Test Side-by-Side comparison export.
10. Force-close and reopen the app to confirm local persistence.

Physical-device testing is recommended for camera behavior because emulator camera support can be uneven.

## Useful Commands

```powershell
# Web development
npm run dev
npm run typecheck
npm run build
npm run preview

# Capacitor
npx cap sync android
npx cap open android

# Android
adb devices
adb logcat
Set-Location android
.\gradlew.bat assembleDebug
```

## Current Limitations

- Only Android packaging is configured; iOS has not been added.
- Release signing and Google Play publishing are not configured.
- Time-lapse export depends on browser/WebView support for `MediaRecorder` and VP9 WebM.
- The web UI currently loads Tailwind CSS and Google Fonts from external CDNs, so first load of those resources requires network access.
- Data is local-only. There is no account system, cloud backup, or cross-device sync.
- npm currently reports dependency audit issues; review before production release instead of blindly running automatic fixes.

## Privacy Model

MorphScale currently stores user data locally:

- Logs and photos are stored in IndexedDB.
- Settings are stored in localStorage.
- No backend API or cloud sync is implemented in the current codebase.

Because body photos and weight logs are sensitive personal data, keep release signing keys, credentials, exports, and test data out of version control.
