# Community RideShare App — Requirements Document

## 1. Product Summary
A peer-to-peer, community-based ride-sharing app. Any verified member can act as a **rider** (request a ride) or a **driver** (offer/accept a ride). Rides can be requested **on-demand** or **scheduled** for a future time. Payment is **cash, handled directly between members** — the platform does not process payments.

Deliverables:
- Backend API (single source of truth for both apps)
- Web frontend (admin dashboard + optional member web portal)
- Android app (native or cross-platform)
- iOS app (native or cross-platform)

**Recommended approach:** Build one React Native codebase for Android + iOS to share ~90% of code, plus a separate lightweight web frontend (React) for the admin dashboard. This lets Claude Code build and maintain one mobile codebase instead of two native ones. (State this in the repo README as the chosen architecture.)

---

## 2. User Roles

| Role | Description |
|---|---|
| **Member** | Verified community user. Can request rides AND offer to drive. Same account, dual capability (not separate "driver" vs "rider" accounts). |
| **Admin** | Manages community membership, verifies members, handles disputes/reports, views ride activity. |

No professional/vetted driver tier — every member is both a potential rider and driver.

---

## 3. Core Features

### 3.1 Authentication & Community Membership
- Sign up with phone number + OTP verification
- Join a specific community via invite code / admin approval / verified address
- Profile: name, photo, phone (visibility toggle), home community, member-since date, rating average
- Admin approval queue for new members (configurable: auto-approve or manual)

### 3.2 Ride Request Types
**A. On-Demand Ride**
- Rider sets pickup location (map pin or address search) and destination
- Rider taps "Request Now"
- Request broadcasts to nearby available members (radius configurable, e.g. 5 km)
- First member to accept gets the ride; others notified "already taken"

**B. Scheduled Ride**
- Rider sets pickup, destination, and future date/time
- Visible in a "Scheduled Rides" feed to community members ahead of time
- A member can accept anytime before the scheduled time
- Reminder notifications sent to both parties as the time approaches (e.g. 24h, 1h, 15 min before)

### 3.3 Offering to Drive
- A member can post "I'm driving from X to Y at [time], N seats available" (proactive offer)
- Riders can browse open offers and request to join instead of posting a new request
- Reduces duplicate empty trips in the same direction

### 3.4 Matching & Acceptance Flow
1. Request/offer posted → status `OPEN`
2. Another member taps **Accept** → status `ACCEPTED`, both parties' contact info unlocked, in-app chat opened
3. Driver marks **Arrived at Pickup** → status `IN_PROGRESS`
4. Driver or rider marks **Ride Completed** → status `COMPLETED`
5. Either party can **Cancel** before acceptance; after acceptance, cancellation requires a reason and notifies the other party immediately
6. After completion: both parties rate each other (1–5 stars + optional comment)

### 3.5 Cash Payment Handling
- No payment gateway integration
- App simply displays: "Suggested fare: $X" (optional, based on distance/time — configurable formula or left blank for members to agree verbally)
- Clear in-app disclaimer on every ride confirmation screen: *"Payment is handled directly in cash between members. [App Name] does not process, hold, or guarantee any payment."*

### 3.6 In-App Chat
- Simple 1:1 text chat unlocked only after a ride is accepted
- Used to coordinate exact pickup point, ETA, cash amount
- Chat auto-archives/closes some time after ride completion (e.g. 24h)

### 3.7 Ratings & Trust
- Star rating + short review after each completed ride, both directions (driver rates rider, rider rates driver)
- Average rating shown on member profile
- Report/Block feature: report a member (with reason) → flagged for admin review; block prevents future matching with that member

### 3.8 Notifications (Push)
- New matching request/offer nearby
- Request accepted / cancelled
- Scheduled ride reminders
- Chat message received
- Ride status changes (arrived, completed)

### 3.9 Ride History
- List of past rides (as rider and as driver) with status, other party, date, rating given/received

### 3.10 Admin Dashboard (Web)
- Approve/reject new member requests
- View all active/scheduled/completed rides
- View and act on reported members (warn, suspend, remove)
- Basic community-level settings: matching radius, auto-approve toggle, reminder timing

---

## 4. Data Models (initial schema)

**User**
- id, name, phone, photo_url, community_id, rating_avg, rating_count, status (pending/active/suspended), created_at

**Community**
- id, name, invite_code, auto_approve (bool), matching_radius_km, created_at

**RidePost**
- id, type (REQUEST | OFFER), mode (ON_DEMAND | SCHEDULED), creator_id, pickup_lat, pickup_lng, pickup_address, destination_lat, destination_lng, destination_address, scheduled_time (nullable), seats_available (for OFFER), suggested_fare (nullable), status (OPEN | ACCEPTED | IN_PROGRESS | COMPLETED | CANCELLED), created_at

**RideMatch**
- id, ride_post_id, accepted_by_user_id, accepted_at, arrived_at, completed_at, cancelled_at, cancel_reason

**Rating**
- id, ride_match_id, rater_id, rated_user_id, stars, comment, created_at

**Message**
- id, ride_match_id, sender_id, text, sent_at

**Report**
- id, reporter_id, reported_user_id, reason, ride_match_id (nullable), status (open/reviewed/actioned), created_at

---

## 5. API Endpoints (REST, initial set)

**Auth**
- `POST /auth/signup` — phone + community invite code
- `POST /auth/verify-otp`
- `POST /auth/login`

**Users**
- `GET /users/me`
- `PATCH /users/me`
- `GET /users/:id` (public profile view)

**Ride Posts**
- `POST /rides` — create request or offer
- `GET /rides?status=OPEN&mode=ON_DEMAND&near=lat,lng` — feed
- `GET /rides/:id`
- `POST /rides/:id/accept`
- `POST /rides/:id/cancel`
- `POST /rides/:id/arrived`
- `POST /rides/:id/complete`

**Ratings**
- `POST /rides/:id/rate`

**Chat**
- `GET /rides/:id/messages`
- `POST /rides/:id/messages`

**Reports/Admin**
- `POST /reports`
- `GET /admin/members?status=pending`
- `POST /admin/members/:id/approve`
- `GET /admin/reports`
- `POST /admin/reports/:id/action`

**Notifications**
- Device token registration: `POST /notifications/register-device`

---

## 6. Mobile App Screens (Android + iOS, shared RN codebase)

1. Onboarding / Sign up / OTP verify
2. Join community (invite code)
3. Home feed — toggle between "Nearby Requests" and "Nearby Offers", map + list view
4. Create Ride Post — request or offer, on-demand or scheduled, pickup/destination picker (map)
5. Ride Detail / Confirmation screen (with cash-payment disclaimer)
6. Active Ride screen — status tracker, chat button, arrived/complete buttons
7. Chat screen
8. Ride History
9. Profile (own + others' public view)
10. Ratings screen (post-ride)
11. Notifications list
12. Settings (radius preference, notification toggles, block list)

## 7. Web Frontend (Admin Dashboard)
1. Login (admin only)
2. Pending members queue
3. All rides table/list (filter by status, date, community)
4. Reports queue with action buttons
5. Community settings page

---

## 8. Non-Functional Requirements
- **Location**: use device GPS + map SDK (Google Maps for Android, MapKit or Google Maps for iOS)
- **Real-time updates**: WebSocket or polling for ride status changes and chat (recommend WebSocket via Socket.io for responsiveness)
- **Security**: JWT-based auth, phone OTP verification, rate-limit ride post creation, sanitize all inputs
- **Privacy**: phone numbers hidden until a ride is accepted; only first name + photo shown in public feed
- **Scalability**: MVP can run on a single Postgres instance + Node backend; design schema so it can scale later
- **Offline handling**: mobile app should gracefully queue actions (e.g., "mark completed") if network drops and retry

---

## 9. Recommended Tech Stack

| Layer | Choice |
|---|---|
| Mobile (Android + iOS) | React Native (Expo) |
| Web frontend (admin) | React + Vite |
| Backend | Node.js + Express (or NestJS for structure) |
| Database | PostgreSQL |
| Real-time | Socket.io |
| Auth | JWT + phone OTP (Twilio or similar) |
| Push notifications | Firebase Cloud Messaging |
| Maps | Google Maps SDK (Android/Web), Google Maps or MapKit (iOS) |
| Hosting | Any (Render/Railway/AWS) — leave as deployment decision for later |

---

## 10. Suggested Build Order (for Claude Code)
1. Backend: DB schema + migrations, auth (signup/OTP/login)
2. Backend: Ride post CRUD + accept/cancel/status endpoints
3. Backend: Chat + ratings + reports endpoints
4. Backend: WebSocket layer for live status/chat updates
5. Mobile app: auth flow + community join
6. Mobile app: home feed (map + list) + create ride post (on-demand + scheduled)
7. Mobile app: ride detail, accept flow, active ride tracker
8. Mobile app: chat, ratings, history, profile, notifications
9. Web admin dashboard: member approval, rides view, reports queue
10. Polish: cash-payment disclaimers throughout, empty states, error handling
11. Testing pass + basic CI setup

---

## 11. Explicit Non-Goals (MVP)
- No in-app payment processing of any kind
- No driver background-check/licensing verification workflow (community trust model instead)
- No route optimization / multi-stop pooling (single pickup → single destination only, for MVP)
- No fare negotiation logic beyond an optional suggested-fare display
