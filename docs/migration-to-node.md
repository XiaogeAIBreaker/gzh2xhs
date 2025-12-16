# Migration to Node.js

## Overview

All server-side components are consolidated into a NestJS (Express) API under `apps/api`. Client-facing API contracts remain unchanged.

## Cutover Steps

1. Deploy `apps/api` alongside existing backends.
2. Switch traffic via env flag or client baseURL.
3. Validate parity with contract tests.
4. Decommission Koa, Next route handlers, and FastAPI.

## Mapping

- Next/Python routes → Nest controllers: auth, data, generate, export, finance, kpi, logs, openapi.

## Setup

- `npm run dev:api` to start API.
- Environment: `PORT`, `REDIS_URL`, `DATABASE_URL` optional.
