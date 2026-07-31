# Backend

NestJS + PostgreSQL (Prisma) + Socket.io API for Community RideShare.

## Setup

1. Copy env file and adjust if needed:
   ```
   cp .env.example .env
   ```
2. Start Postgres (from repo root):
   ```
   docker compose up -d
   ```
3. Install dependencies (from repo root, installs all workspaces):
   ```
   npm install
   ```
4. Run migrations and generate the Prisma client:
   ```
   npm run prisma:migrate -w backend
   ```
5. Start the API in watch mode:
   ```
   npm run dev:backend
   ```

API runs on `http://localhost:3000`. Health check: `GET /health`.

## Auth flow

Phone + OTP, no passwords:

1. `POST /auth/signup` `{ phone, inviteCode }` — creates the user against a community, sends an OTP.
2. `POST /auth/login` `{ phone }` — for existing users, sends a new OTP.
3. `POST /auth/verify-otp` `{ phone, code }` — verifies the code and returns a JWT.

No SMS provider is wired up yet — OTP codes are logged to the console (see
`src/common/otp/otp.service.ts`). Swap in Twilio (or similar) there when ready.

## Real-time (Socket.io)

Connect authenticated, at `http://localhost:3000` (default `/socket.io` path), passing the JWT
from `verify-otp` in the handshake:

```js
io('http://localhost:3000', { auth: { token: accessToken } });
```

On connect the server joins the socket to two rooms: one private to the user
(`user:<userId>`) and one shared by their whole community (`community:<communityId>`). An
invalid or missing token disconnects the socket immediately.

Events emitted by the server:

| Event | Room | Payload | When |
|---|---|---|---|
| `ride:new` | community | ride post (no phone numbers) | a new OPEN ride post is created |
| `ride:taken` | community | `{ rideId }` | a ride post is accepted, so others should drop it from their feed |
| `ride:accepted` | creator | full ride post + match | someone accepts the creator's post |
| `ride:arrived` | the other participant | full ride post + match | the driver marks arrival |
| `ride:completed` | the other participant | full ride post + match | either party marks the ride complete |
| `ride:cancelled` | the other participant (full details) + community (`{ rideId }`) | see above | a ride is cancelled after acceptance |
| `message:new` | recipient | chat message | a chat message is sent on an accepted ride |

There's no client library in this repo yet — the mobile app step will add `socket.io-client`.

## Ride history

`GET /rides/mine` returns every ride post the caller is party to as either creator or
acceptor, any status — unlike `GET /rides`, which deliberately excludes the caller's own
posts (it's a browse-others feed, not a history). Each item also carries `myRating` /
`theirRating` (the stars given/received on that ride, `null` if not rated), so a mobile
history screen doesn't need a separate ratings lookup.

## Admin

Members have a `role` of `MEMBER` or `ADMIN`. There's no signup flow for admins — promote an
existing member from the command line:
```
npm run prisma:make-admin -w backend -- <phone>
```

Admin-only endpoints (require `role: ADMIN` and `status: ACTIVE`), scoped to the admin's own
community:

- `GET /admin/members?status=PENDING` — membership queue (`status` defaults to `PENDING`)
- `POST /admin/members/:id/approve` — `PENDING` → `ACTIVE`
- `GET /admin/reports?status=OPEN` — reports against members in your community (`status` defaults to `OPEN`)
- `POST /admin/reports/:id/action` `{ action: "WARN" | "SUSPEND" | "REMOVE" | "DISMISS" }` —
  `SUSPEND`/`REMOVE` also set the reported member's status to `SUSPENDED` (there's no separate
  "removed" account state yet); `DISMISS` closes the report with no action taken.
- `GET /admin/rides?status=&from=&to=` — every ride post in the community, any status
  (unlike `/rides` and `/rides/mine`, this isn't scoped to a single member). `from`/`to`
  filter on `createdAt` and are optional ISO 8601 dates.
- `GET /admin/community` / `PATCH /admin/community` `{ name?, autoApprove?, matchingRadiusKm? }`
  — community settings. `inviteCode` isn't editable through this endpoint.

## Notifications

`POST /notifications/register-device` `{ token, platform: "ios" | "android" | "web" }` — upserts
a device token by `token`, so the same physical device re-registering (app restart, different
member logging in) moves the token rather than duplicating it. This only stores the token — no
push provider (FCM) is wired up yet; that lands with the mobile app.

## Seeding a community

Run the seed script to create a demo community and invite code:
```
npm run prisma:seed -w backend
```
This creates community `Demo Neighborhood` with invite code `DEMO1234` (auto-approve on).
