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

- `src/api/` — `apiRequest()` fetch wrapper (attaches the Bearer token, normalizes Nest's error shape), shared response types, and one module per resource: `rides.ts` (list/mine/get/create/accept/arrived/complete/cancel), `chat.ts`, `ratings.ts`, `users.ts`, `blocks.ts`, `reports.ts`, `notifications.ts`.
- `src/auth/` — `AuthContext` (signup/login/verifyOtp/logout, session restore on launch, `setUser` for updating the cached profile after an edit) and token storage (AsyncStorage — see note below).
- `src/realtime/SocketContext.tsx` — opens a Socket.io connection once signed in (same JWT as the API), closes it on sign-out. `useSocket()` returns the raw socket so screens can subscribe to the events documented in `../docs/api-reference.html`.
- `src/location/useCurrentLocation.ts` — wraps `expo-location` permission request + `getCurrentPositionAsync`, with a coordinate-only fallback when reverse geocoding isn't available (notably: not on web).
- `src/rides/roles.ts` — `getDriver`/`getRider`/`getOtherParticipant`, mirroring the backend's REQUEST-vs-OFFER role-assignment logic so the client doesn't have to re-derive it differently in each screen.
- `src/settings/` — `preferences.ts` (AsyncStorage-backed search radius + notifications-enabled, purely client-side) and `pushNotifications.ts` (best-effort Expo push token registration).
- `src/components/` — small shared UI pieces (`TextField`, `PrimaryButton`, `ErrorBanner`, `SegmentedControl`, `RideCard`, `CashDisclaimer`, `StatusTracker`, `StarRating`) used across screens.
- `src/screens/` — `WelcomeScreen`, `JoinCommunityScreen` (signup), `LoginScreen`, `VerifyOtpScreen`, `HomeScreen` (the ride feed), `CreateRidePostScreen`, `RideDetailScreen`, `ActiveRideScreen`, `ChatScreen`, `RatingScreen`, `RideHistoryScreen`, `ProfileScreen`, `PublicProfileScreen`, `SettingsScreen`, `MenuScreen`.
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

### Chat, ratings, history, profile, settings

`ChatScreen` (reached from `ActiveRideScreen`'s **Chat** button, and from a completed ride in history) shows `GET /rides/:id/messages` as bubbles and subscribes to `message:new`, filtered by `rideMatchId` so a message on one ride's chat can't leak into a different one. Sending is disabled implicitly by the backend once chat closes (24h after completion) — the send call just surfaces that 403 like any other error.

`RatingScreen` shows once a ride is `COMPLETED` (a **Rate this ride** button appears on the terminal state of `ActiveRideScreen`/history detail): five tappable stars + an optional comment, `POST /rides/:id/rate`. A 409 (already rated) is treated as success from the user's perspective — an alert saying so, then back. The button doesn't hide itself after rating in the same session (no client-side "already rated" tracking yet, since there's no `GET` for a single rating) — tapping again just re-surfaces that same friendly message rather than double-submitting.

`RideHistoryScreen` (`GET /rides/mine` — a backend endpoint added in this step, since the feed endpoint deliberately excludes your own posts and has no notion of "mine") lists every ride the member has been part of as either role, with status, the other party, and `myRating`/`theirRating` if the ride is complete. It refetches on every focus (`useFocusEffect`), not just on mount, so returning to it after rating or after a ride progresses shows current data rather than whatever was cached from an earlier visit.

`ProfileScreen` edits name / photo URL / phone-visibility (`PATCH /users/me`) and pushes the result back into `AuthContext` via `setUser` so the rest of the app immediately reflects it. `PublicProfileScreen` (reached by tapping the other participant's name on the tracker) shows another member's public info plus **Report member** (inline reason form, `POST /reports`) and **Block member** (`POST /blocks`, gated behind a confirm alert — see the `Alert.alert` note below for why that specific action isn't clickable in the web test harness, though the backend behavior is verified separately).

`SettingsScreen` covers the three things doc section 6 asks for: a **search radius** override (chips, purely local via `preferences.ts`, applied as the `radiusKm` query param `HomeScreen` already knew how to send — re-read on every `HomeScreen` focus so a change applies the moment you go back to the feed), a **push notifications** toggle (best-effort: requests permission, tries to get a real Expo push token and register it via `POST /notifications/register-device`; reports back and reverts the toggle if that fails rather than pretending it worked), and the **blocked members** list (`GET/DELETE /blocks`).

There's no "notifications list/inbox" screen: the backend has no persisted notification feed (no such table in the schema, and no push provider wired up), so "notifications" here means the real-time socket alerts already built into the feed/tracker plus this registration toggle — not a separate screen with history.

### Deferred: map view / map-based location picker

The requirements doc calls for a map alongside the list, and a map picker for setting pickup/destination. That's deliberately not built yet: `react-native-maps` has no web support, and this dev environment has no Android/iOS device or emulator to actually verify native map rendering on — shipping it now would mean unverified code. The feed and create-post flow are fully functional without it (list view, manual/geolocated coordinates); add the map once there's a way to test it on a real device or simulator.

### Deferred: offline action queueing

The doc's non-functional requirements ask for actions like "mark completed" to queue and retry when the network drops. Not built — it's a genuine feature (persisted queue, retry/backoff, conflict handling when the queued action no longer applies) rather than a small addition, and every screen already fails predictably offline (the request throws, the existing `ApiError` handling shows a message, nothing is silently lost — the user just has to retry manually once back online).

## Known simplification

Token storage uses `@react-native-async-storage/async-storage` rather than `expo-secure-store`, because AsyncStorage also works on web (needed to test this flow with a browser in a headless dev environment) while SecureStore has no web support. Swap to SecureStore (native-only, gated behind `Platform.OS`) before a real release — an unencrypted JWT at rest is fine for this MVP milestone, not for production.

## Testing note

There's no device/emulator in this dev environment, so screens are verified via `expo start --web` driven by a headless Chromium (Playwright — `chromium-cli` wasn't available here). That covers all the cross-platform logic (API calls, state, sockets, geolocation via mocked browser permissions) but not native-only surfaces like real map rendering or push notifications.

Automated unit tests (`npm run test -w mobile`, via `jest-expo`) cover pure logic only —
currently `src/rides/roles.ts` (the REQUEST-vs-OFFER driver/rider assignment, the one piece
of client logic with a real "easy to get backwards" risk). Screens themselves aren't
component-tested; the Playwright pass above is what actually exercises them, end to end,
against a running backend — a more faithful check than mocked component tests would be for
UI this state/network-heavy, but it means there's no fast CI signal for screen-level
regressions the way `src/rides/roles.ts` has one.

One thing this surfaced: `Alert.alert(title, message, [button, button])` — the multi-custom-button form, used for the `ride:accepted` notification and for the block-member confirmation — doesn't render a visible dialog on react-native-web (confirmed the underlying socket event/handler still fire correctly; only the web UI is a no-op). Single-button/default alerts (used everywhere else — error messages, confirmations, the report-submitted toast) do work on web via `window.confirm`/`alert`. This is a web-target-only quirk, not a bug: `Alert.alert` with custom buttons works as designed on iOS/Android, which is what this actually ships to. Where a web click-through test needed to get past one of these (blocking a member), the underlying REST call was verified directly instead, then confirmed rendering correctly in the UI once the state existed.
