# Web (Admin Dashboard)

React + Vite admin dashboard for Community RideShare. Talks to the same backend as the
mobile app, gated to accounts with `role: ADMIN`.

## Setup

1. Copy the env file and point it at your backend:
   ```
   cp .env.example .env
   ```
2. From the repo root, install dependencies (installs all workspaces) and start the
   backend per [backend/README.md](../backend/README.md).
3. Start the dashboard:
   ```
   npm run dev -w web
   ```

Runs on `http://localhost:5173`.

## Auth

Same phone + OTP flow as the backend/mobile app — there's no separate admin login
mechanism. After verifying the code, the app fetches `/users/me` and checks
`role === 'ADMIN'`; anything else is rejected and the token is discarded. See
[backend/README.md](../backend/README.md#admin) for how to promote a member to admin
(`npm run prisma:make-admin -w backend -- <phone>`) — there's no signup flow for admins.

The access token is kept in `localStorage` (`rideshare.admin.accessToken`), not
`sessionStorage`, so a page reload doesn't sign you out.

## Pages

- **Members** — status-tabbed roster (Pending / Active / Suspended); approve pending
  members.
- **Rides** — every ride post in the community, any status, filterable by status and
  created-date range. Unlike the mobile feed, this is oversight-only — no accept/cancel
  actions from here.
- **Reports** — status-tabbed report queue; action an open report (Warn / Suspend /
  Remove / Dismiss).
- **Settings** — community name, auto-approve toggle, and default matching radius. The
  invite code is shown but isn't editable here (regenerating it could orphan in-flight
  signups).

All four pages hit endpoints under `/admin/*` — see `docs/api-reference.html` at the repo
root for exact request/response shapes.

## Known gaps

- No live updates (Socket.io) — pages fetch on load/filter-change only. The doc's
  non-functional requirements don't call for real-time on the admin side the way they do
  for mobile, so this was left as a manual-refresh dashboard rather than adding a second
  socket consumer.
- Rides page has no pagination — fine at the current data volumes, would need it before
  a community's ride history grows large.
