# Community RideShare

Peer-to-peer, community-based ride-sharing app. Any verified member can act as a rider or driver.
Cash payment handled directly between members — the platform does not process payments.

Full requirements: [rideshare-app-requirements.md](rideshare-app-requirements.md)

## Architecture

Monorepo (npm workspaces) with three deliverables sharing one backend:

- **`backend/`** — NestJS + PostgreSQL (Prisma) + Socket.io. Single source of truth API for both apps.
- **`mobile/`** — React Native (Expo), one codebase for Android + iOS (~90% shared code).
- **`web/`** — React + Vite admin dashboard.

This structure was chosen so a single mobile codebase covers both app stores instead of
maintaining separate native Android/iOS apps, while the backend stays framework-agnostic
to both clients.

## Getting started

See [backend/README.md](backend/README.md) to run the API locally. Mobile and web apps are
built against the backend once its core endpoints are stable (see build order in the
requirements doc, section 10).

## Status

- [x] Backend: DB schema + auth (signup / OTP / login)
- [x] Backend: Ride post CRUD + accept/cancel/status endpoints
- [x] Backend: Chat + ratings + reports endpoints
- [x] Backend: WebSocket layer for live status/chat updates
- [x] Backend: admin endpoints (member approval, report actions) + device registration
- [ ] Mobile app
- [ ] Web admin dashboard
