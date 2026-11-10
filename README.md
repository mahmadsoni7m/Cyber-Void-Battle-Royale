# Cyber Void: Battle Royale (Android)

Offline first-person 3D Battle Royale prototype built with React, Three.js, Vite and Capacitor.

## Build APK with GitHub Actions
1. Upload the contents of this folder to the root of a GitHub repository.
2. Open **Actions** and run **Build Cyber Void Android APK** (or push to `main`/`master`).
3. Download the `Cyber-Void-Battle-Royale-APK` artifact.
4. Extract the artifact ZIP to obtain `app-debug.apk`.

## Important
- Vite uses relative asset paths (`base: './'`) so JavaScript and CSS load correctly inside Android's Capacitor WebView. This fixes a common blank-screen cause from root-relative `/assets/...` paths.
- This is an offline prototype with AI bots, not online multiplayer.
- The device must support WebGL.
- GitHub Actions builds a debug APK. A signed release build requires a keystore and signing secrets.
