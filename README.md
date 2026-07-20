# MorphScale

MorphScale is a visual fitness journey tracker built around alignment photography and transformation tracking. It is designed to help users capture progress consistently and turn those captures into smoother visual comparisons over time.

## Stack

- React
- TypeScript
- Vite
- Capacitor
- PWA tooling
- Recharts

## Features

- Camera-assisted progress capture
- Alignment-focused transformation workflow
- Mobile-oriented packaging through Capacitor
- Visual tracking and chart support

## Development and Android builds

Required software:

- Node.js 22 LTS (the version is declared in `.nvmrc`)
- npm
- Android Studio with Android SDK 36
- JDK 21 (the Android Studio bundled JDK is recommended)

Install dependencies and start the web development server:

```powershell
npm install
npm run dev
```

Type-check and create the production web build in `dist/`:

```powershell
npm run typecheck
npm run build
```

`dist/` is the `webDir` used by Capacitor. Both `dist/` and the synchronized copy under Android assets are generated and intentionally ignored by Git. After a fresh clone, build and synchronize before opening or compiling Android:

```powershell
npm install
npm run build
npx cap sync android
npx cap open android
```

To build a debug APK without opening Android Studio:

```powershell
Set-Location android
.\gradlew.bat assembleDebug
```

The resulting APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

## Known limitations

- Only Android packaging is configured; an iOS project has not been created.
- Release signing and Google Play publishing are not configured. Keep keystores and signing credentials outside version control.
- Time-lapse export depends on browser/WebView support for VP9 WebM recording.
- The web UI currently loads Tailwind CSS and Google Fonts from external CDNs, so those resources require a network connection on first load.
