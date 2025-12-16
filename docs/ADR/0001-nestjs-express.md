# ADR-0001: Consolidate APIs on NestJS (Express)

## Context

Multiple backends existed (Next.js handlers, Koa, FastAPI). We need a single Node.js runtime with strong typing, modularity, and tooling.

## Decision

Use NestJS 10 with Express adapter for the consolidated API. Adopt TypeScript, @nestjs/config, guards/interceptors, and Swagger.

## Consequences

- Unified middleware and error handling.
- Easier testing (Jest + supertest) and CI integration.
- Stream-friendly implementation for heavy I/O.
