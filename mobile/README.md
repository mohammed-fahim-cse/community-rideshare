# Mobile

React Native (Expo) app for Community RideShare — one codebase for Android + iOS.

## Setup

1. Copy the env file and point it at your backend:
   ```
   cp .env.example .env
   ```
   - **Expo web / iOS simulator on the same machine as the backend**: `http://localhost:3000` works as-is.
   - **Android emulator**: use `http://10.0.2.2:3000` (the emulator's alias for the host machine's localhost).
   - **Physical device**: use your machine's LAN IP, e.g. `http://192.168.1.23:3000` — the device and backend must be on the same network.
2. Make sure the backend is running (see [../backend/README.md](../backend/README.md)).
3. From the repo root:
   ```
   npm install
   npm run start -w mobile
   ```
   Then press `w` for web, `a` for Android, `i` for iOS (Mac only), or scan the QR code with Expo Go.

## Structure

- `src/api/` — `apiRequest()` fetch wrapper (attaches the Bearer token, normalizes Nest's error shape) and shared response types.
- `src/auth/` — `AuthContext` (signup/login/verifyOtp/logout, session restore on launch) and token storage (AsyncStorage — see note below).
- `src/components/` — small shared UI pieces (`TextField`, `PrimaryButton`, `ErrorBanner`) used across the auth screens.
- `src/screens/` — `WelcomeScreen`, `JoinCommunityScreen` (signup), `LoginScreen`, `VerifyOtpScreen`, `HomeScreen` (stub — the real feed lands in the next build step).
- `src/navigation/RootNavigator.tsx` — swaps between the auth stack and the app stack based on `AuthContext`'s status; no manual "navigate to home" calls needed after verifying OTP.

## Auth flow

Matches the backend's phone + OTP flow (no passwords):

1. **New member**: Welcome → "Join with invite code" → phone + invite code (`POST /auth/signup`) → OTP screen.
2. **Returning member**: Welcome → "I already have an account" → phone only (`POST /auth/login`) → OTP screen.
3. Either path ends at the same `VerifyOtpScreen` (`POST /auth/verify-otp`), which stores the JWT and fetches `/users/me`. `RootNavigator` then switches to the app stack automatically.
4. On launch, a stored token is revalidated against `/users/me`; an expired/invalid token silently falls back to signed-out rather than erroring.

A member whose `status` is still `PENDING` (awaiting admin approval) does reach `HomeScreen` — the token is valid — but sees a banner saying so instead of the ride feed.

## Known simplification

Token storage uses `@react-native-async-storage/async-storage` rather than `expo-secure-store`, because AsyncStorage also works on web (needed to test this flow with a browser in a headless dev environment) while SecureStore has no web support. Swap to SecureStore (native-only, gated behind `Platform.OS`) before a real release — an unencrypted JWT at rest is fine for this MVP milestone, not for production.
