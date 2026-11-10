# Cyber Void: Battle Royale (Android)

A mobile-first, offline first-person battle-royale prototype built with React, TypeScript, Three.js and Capacitor. The match contains the player and 12 AI opponents, a shrinking safe zone, health, ammo, eliminations, pause and restart flow. It is an offline bot match; online multiplayer, accounts, matchmaking and server-authoritative combat are not included.

## Run locally

```bash
npm install
npm run dev
```

## Build web bundle

```bash
npm run build
```

## Build Android APK locally

```bash
npm install
npm run build
npx cap add android
python3 scripts/prepare-android.py
npx cap sync android
cd android
./gradlew assembleDebug
```

## Build APK with GitHub Actions

1. Upload the contents of this repository to the root of a GitHub repository.
2. Open **Actions** and run **Build Cyber Void Android APK**, or push to `main` / `master`.
3. Download `Cyber-Void-Battle-Royale-APK` from the workflow run's **Artifacts** section.

The artifact contains `app-debug.apk`. It is for testing/sideloading. A Play Store release requires a signed release build and a protected signing key.

## Controls

- Desktop: WASD / arrow keys to move, mouse drag to look, Space to fire, Escape to pause.
- Touch: left virtual pad to move, drag the scene to look, FIRE to shoot, reload icon to refill the magazine.

The game is designed for landscape orientation and immersive full-screen Android display.
