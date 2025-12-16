# API Reference (NestJS)

- `GET /health` → `{ ok: boolean, ts: number }`
- `POST /generate` → `{ ok: boolean, data: {...} }` (auth required)
- `POST /export` → `{ ok: boolean, data: { url } }` (auth required)
- `POST /finance/pricing|report|risk` → results (auth required)
- `GET /data` → list (admin required)
- `POST /data` → create
- `PUT /data` → update
- `DELETE /data` → delete
- `GET /logs` → list (admin required)
- `GET /openapi` → OpenAPI JSON

Headers:

- `Authorization: Bearer <token>`
- `x-idempotency-key` for idempotent POSTs
- `x-request-id` optional trace
