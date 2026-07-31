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
- [x] Backend: `GET /rides/mine` for ride history (added alongside the mobile history screen)
- [x] Mobile: auth flow + community join (Expo, `mobile/`)
- [x] Mobile: home feed + create ride post (map view deferred — see mobile/README.md)
- [x] Mobile: ride detail, accept flow, active ride tracker
- [x] Mobile: chat, ratings, history, profile, settings (notifications list deferred — no backend feed to show; see mobile/README.md)
- [x] Backend: `GET/PATCH /admin/community` + `GET /admin/rides` (added alongside the web dashboard)
- [x] Web admin dashboard: members, rides, reports, community settings (`web/`)
- [x] Polish pass — disclaimers, empty states, and error handling turned out to already be
      covered from building each screen carefully; this pass mainly fixed broken/missing
      lint tooling (backend had no working ESLint config despite the script existing;
      mobile had none at all) and documented the offline-handling scope cut
- [x] Testing pass + CI — backend e2e (Jest + Supertest, real Postgres, 20 tests incl. the
      concurrent-accept race condition), mobile + web unit tests, GitHub Actions
      (`.github/workflows/ci.yml`) running lint/typecheck/test/build across all three
      workspaces on every push and PR

## CI

[![CI](https://github.com/mohammed-fahim-cse/community-rideshare/actions/workflows/ci.yml/badge.svg)](https://github.com/mohammed-fahim-cse/community-rideshare/actions/workflows/ci.yml)
