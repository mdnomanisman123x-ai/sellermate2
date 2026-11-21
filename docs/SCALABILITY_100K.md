# SellerMate 100K Concurrent-User Scalability Plan

Status: architecture target and engineering checklist. This document is not a capacity certification.

## 1. Capacity target and honest definition

Product target: support 100,000 concurrent authenticated user sessions.

A concurrent session is not the same as 100,000 simultaneous database writes. Capacity must be measured with realistic user journeys and reported using:
- virtual users connected and authenticated;
- requests per second (RPS) and peak in-flight requests;
- read/write mix and payload sizes;
- p50, p95, and p99 latency;
- HTTP/database error rates and timeout rates;
- database CPU, memory, connections, locks, and I/O;
- cost per 1,000 active users / per month.

The final acceptance profile must be agreed before certification. Until then, 100K is a design target, not a claim that the current deployment can handle it.

## 2. Current repository findings (verified from the rebuild branch)

- Next.js 14 / React 18 / TypeScript and Supabase JS are installed.
- Authentication and business workspace lookup currently use the browser Supabase client.
- The main dashboard initializes example records and persists sales, expenses, customers, and products in browser localStorage.
- The checked-in SQL migration is for a separate data marketplace, not the complete business-management data model.
- package.json currently has dev/build/start scripts, but no test, lint, or load-test scripts.
- Therefore, current code is a prototype foundation and is not ready for production financial data or high concurrency.

## 3. Target logical architecture

1. Edge/CDN: cache immutable static assets; never publicly cache private business responses.
2. Web application: stateless Next.js application instances; keep server-side secrets out of browser bundles.
3. API/service layer: authenticated, validated, business-scoped operations; rate limits and request size limits.
4. Database: managed PostgreSQL with connection pooling, indexed tenant-scoped queries, migrations, backups and point-in-time recovery where available.
5. Cache: introduce Redis or equivalent only for measured hot reads, short-lived sessions/limits, and derived data; PostgreSQL remains source of truth.
6. Background jobs: queue slow/non-interactive work (exports, notifications, reports, AI tasks); workers must be idempotent and retry safely.
7. Observability: centralized structured logs, metrics, traces, error reporting, uptime checks and actionable alerts.
8. Security: Supabase Auth, RLS for every tenant-owned table, server-side authorization, least-privilege keys, audit logs and tested backup/restore.

## 4. Multi-tenant data rules

- Every tenant-owned row has a non-null business_id and appropriate foreign keys.
- Membership is represented explicitly; do not assume a user owns only one business.
- RLS policies verify active membership and role for every read/write.
- Add indexes beginning with business_id for common tenant-scoped filters and joins; validate with EXPLAIN (ANALYZE, BUFFERS) on representative data.
- Financial records use transactions and immutable/traceable corrections; never rely on browser calculations as the accounting source of truth.
- Never expose service-role credentials to the client.
- Do not create or apply schema changes that drop/rename existing tables without a verified backup and explicit approval.

## 5. Performance engineering rules

- Paginate lists; do not fetch entire business histories into the browser.
- Select only required columns; avoid N+1 queries and unbounded joins.
- Use server-side validation and atomic database transactions for stock and financial changes.
- Keep API handlers stateless and safe for horizontal scaling.
- Add idempotency keys to retryable money-moving or order-creation operations.
- Cache only data with a clear invalidation strategy; never cache private tenant data under shared public cache keys.
- Use async jobs for expensive exports, bulk imports, notifications and AI analysis.
- Define per-user and per-tenant rate limits; protect login and expensive endpoints.
- Design for graceful degradation when cache, queue or third-party services fail.

## 6. Delivery phases

### Phase A — audit and secure foundation
- Inspect actual Supabase tables, columns, constraints, indexes, triggers, grants and RLS policies.
- Verify business ownership/membership semantics and existing data before proposing migrations.
- Replace demo/localStorage business records with database-backed operations, one module at a time.
- Add validation, error states, authorization tests and CI build/type checks.

### Phase B — production core
- Products, stock ledger, customers, sales, purchases, expenses and payments.
- Use transactional database functions for operations that must update multiple records atomically.
- Add pagination, tenant-scoped indexes and audit trail.
- Test cross-business access denial.

### Phase C — scale baseline
- Establish production-like dataset and representative workload.
- Run load tests at 100, 500, 1K, 5K and 10K virtual users; tune bottlenecks at each step.
- Verify database pool limits, app instance limits, queue behavior and recovery.
- Scale managed plans only when metrics justify it.

### Phase D — 100K validation
- Ramp to 100K virtual sessions using realistic think times and mixed read/write journeys.
- Test steady state, sudden spikes, long-duration soak, hot tenants, large tenants and failure/recovery.
- Record the exact infrastructure, workload, RPS, latency percentiles, error rate and monthly cost.
- Do not advertise 100K capacity until repeatable tests meet agreed SLOs.

## 7. Initial service-level objectives to review

Proposed starting objectives, subject to product/business approval:
- ordinary dashboard/list reads: p95 <= 500 ms at the API layer under agreed load;
- common create/update actions: p95 <= 800 ms excluding external payment/provider latency;
- server error rate < 0.5% during steady-state target workload;
- no cross-tenant data exposure;
- successful backup restore drill and documented recovery procedure.

These are proposed targets, not measured results or guarantees.

## 8. Immediate next step

Read-only audit of the live Supabase schema and RLS policies. Collect the actual table/column/index/policy inventory first. Only then write a new additive migration for the business platform. Do not enable broad public exposure or run destructive SQL as part of the audit.
