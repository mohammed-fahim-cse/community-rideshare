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

- `src/api/` — `apiRequest()` fetch wrapper (attaches the Bearer token, normalizes Nest's error shape), shared response types, and `rides.ts` (list/get/create/accept/arrived/complete/cancel).
- `src/auth/` — `AuthContext` (signup/login/verifyOtp/logout, session restore on launch) and token storage (AsyncStorage — see note below).
- `src/realtime/SocketContext.tsx` — opens a Socket.io connection once signed in (same JWT as the API), closes it on sign-out. `useSocket()` returns the raw socket so screens can subscribe to the events documented in `../docs/api-reference.html`.
- `src/location/useCurrentLocation.ts` — wraps `expo-location` permission request + `getCurrentPositionAsync`, with a coordinate-only fallback when reverse geocoding isn't available (notably: not on web).
- `src/rides/roles.ts` — `getDriver`/`getRider`/`getOtherParticipant`, mirroring the backend's REQUEST-vs-OFFER role-assignment logic so the client doesn't have to re-derive it differently in each screen.
- `src/components/` — small shared UI pieces (`TextField`, `PrimaryButton`, `ErrorBanner`, `SegmentedControl`, `RideCard`, `CashDisclaimer`, `StatusTracker`) used across screens.
- `src/screens/` — `WelcomeScreen`, `JoinCommunityScreen` (signup), `LoginScreen`, `VerifyOtpScreen`, `HomeScreen` (the ride feed), `CreateRidePostScreen`, `RideDetailScreen`, `ActiveRideScreen`.
- `src/navigation/RootNavigator.tsx` — swaps between the auth stack and the app stack based on `AuthContext`'s status; no manual "navigate to home" calls needed after verifying OTP.

## Auth flow

Matches the backend's phone + OTP flow (no passwords):

1. **New member**: Welcome → "Join with invite code" → phone + invite code (`POST /auth/signup`) → OTP screen.
2. **Returning member**: Welcome → "I already have an account" → phone only (`POST /auth/login`) → OTP screen.
3. Either path ends at the same `VerifyOtpScreen` (`POST /auth/verify-otp`), which stores the JWT and fetches `/users/me`. `RootNavigator` then switches to the app stack automatically.
4. On launch, a stored token is revalidated against `/users/me`; an expired/invalid token silently falls back to signed-out rather than erroring.

A member whose `status` is still `PENDING` (awaiting admin approval) does reach `HomeScreen` — the token is valid — but sees a banner saying so instead of the ride feed.

## Home feed + create ride post

`HomeScreen` is the feed: a segmented "Nearby Requests" / "Nearby Offers" toggle over a `FlatList` of `GET /rides` results, optionally geo-filtered if location permission is granted (falls back to the unfiltered community feed otherwise — the feed never blocks on permission). It subscribes to `ride:new` (prepends a matching post), `ride:taken`, and `ride:cancelled` (both remove the post) over the socket, so the list updates live without polling. Pull-to-refresh re-fetches. Tapping a card navigates to `RideDetailScreen` rather than accepting inline — see below.

`CreateRidePostScreen` posts a request or an offer, on-demand or scheduled, with the cash-payment disclaimer shown before submit (doc section 3.5). The pickup point can be set via **Use current location** (`expo-location`) or typed manually; destination is manual address + latitude/longitude — there's no map-based pin picker yet (see below).

### Ride detail, accept flow, active ride tracker

`RideDetailScreen` (`GET /rides/:id`) is the confirmation step the doc calls for: full ride info, the cash disclaimer, and the actual **Accept** button (`POST /rides/:id/accept`) — accepting inline from the feed card was deliberately removed once this screen existed, so there's exactly one accept path. A 409 (someone else took it first) shows an alert and pops back to the feed; the screen also listens for `ride:taken`/`ride:cancelled` while open in case that happens while the user is still looking at it.

`ActiveRideScreen` receives the full ride object via navigation params (no extra fetch — either straight from the accept response, or from a `ride:accepted` notification) and is the tracker: a 3-step status indicator (Accepted → Driver arrived → Completed), the other participant's now-unlocked name/rating/phone (tap to call via `Linking`), and role-conditional actions — **Mark arrived** (driver only, `POST /rides/:id/arrived`), **Mark completed** (either party, `POST /rides/:id/complete`), and **Cancel ride** (either party; typing a reason is required once accepted, matching the backend's rule, via an inline form rather than `Alert.prompt` since that's iOS-only). It subscribes to `ride:arrived`/`ride:completed`/`ride:cancelled` so the *other* party's actions update the screen live; the acting party's own button press updates state directly from the REST response.

The creator of a post never sees it in their own feed (the backend excludes your own posts), so `HomeScreen` also listens for `ride:accepted` — sent only to the creator's own room — and offers to jump straight to `ActiveRideScreen` when someone accepts their post. That's currently the only way a creator reaches the tracker for their own ride; a persistent "my active ride" entry point is a reasonable follow-up but wasn't in this step's scope.

The **Chat** button on `ActiveRideScreen` is present (per the doc's screen spec) but just shows a "coming soon" alert — the backend chat API is done, but building the actual chat screen is explicitly the next build-order step, alongside ratings/history/profile/notifications.

### Deferred: map view / map-based location picker

The requirements doc calls for a map alongside the list, and a map picker for setting pickup/destination. That's deliberately not built yet: `react-native-maps` has no web support, and this dev environment has no Android/iOS device or emulator to actually verify native map rendering on — shipping it now would mean unverified code. The feed and create-post flow are fully functional without it (list view, manual/geolocated coordinates); add the map once there's a way to test it on a real device or simulator.

## Known simplification

Token storage uses `@react-native-async-storage/async-storage` rather than `expo-secure-store`, because AsyncStorage also works on web (needed to test this flow with a browser in a headless dev environment) while SecureStore has no web support. Swap to SecureStore (native-only, gated behind `Platform.OS`) before a real release — an unencrypted JWT at rest is fine for this MVP milestone, not for production.

## Testing note

There's no device/emulator in this dev environment, so screens are verified via `expo start --web` driven by a headless Chromium (Playwright — `chromium-cli` wasn't available here). That covers all the cross-platform logic (API calls, state, sockets, geolocation via mocked browser permissions) but not native-only surfaces like real map rendering or push notifications.

One thing this surfaced: `Alert.alert(title, message, [button, button])` — the multi-custom-button form used for the `ride:accepted` notification — doesn't render a visible dialog on react-native-web (confirmed the underlying socket event and handler both fire correctly; only the web UI is a no-op). Single-button/default alerts (used everywhere else — error messages, confirmations) do work on web via `window.confirm`/`alert`. This is a web-target-only quirk, not a bug: `Alert.alert` with custom buttons works as designed on iOS/Android, which is what this actually ships to.
