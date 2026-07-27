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

## Seeding a community

Until admin endpoints exist, run the seed script to create a demo community and invite code:
```
npm run prisma:seed -w backend
```
This creates community `Demo Neighborhood` with invite code `DEMO1234` (auto-approve on).
