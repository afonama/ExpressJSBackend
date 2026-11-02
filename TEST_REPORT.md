# Tableflow Test Report

**Status: Backend tests pass once with coverage; flakiness and mutation verification are incomplete.** No frontend or designated staging environment is present, so browser, accessibility, visual, contract, and load layers remain unverified. Do not treat this report as a production-readiness sign-off.

## Executive summary

The latest complete test run passed **91 integration tests** and **43 unit tests**. The integration run included a real loopback PostgreSQL test database; the unit suite used mocked Prisma dependencies. Stock contention, bill uniqueness, optimistic status updates, refresh-token replay, authorization, malformed JSON, and oversized payload checks passed. Coverage is measured, but the mutation run aborted partway through and a second unchanged full-suite run could not be completed because the command runner stopped accepting commands.

The backend has no frontend or staging deployment in this workspace. The test report therefore cannot establish browser journeys, client/server contract compatibility, accessibility, visual stability, or production capacity.

## Results by layer

| Layer | Tests / checks written | Passing | Failing / incomplete | Line / branch coverage | Status |
|---|---:|---:|---:|---:|---|
| 1. Unit | 43 | 43 | 0 | 91.22% / 74.14% | Passed |
| 2. Integration | 91 | 91 | 0 | 88.42% / 61.60% | Passed once |
| 3. Security / authorization | 46 dedicated security cases, plus auth boundary cases; included in Layer 2 | 46 | 0 | Included in Layer 1/2 | Passed for listed inputs; endpoint matrix below |
| 4. Concurrency / race conditions | 10 concurrent scenarios/assertion cases, included in Layer 2 | 10 | 0 | Included in Layer 1/2 | Passed |
| 5. End-to-end | 0 | 0 | Not run | N/A | Blocked: no frontend |
| 6. Contract | 0 | 0 | Not run | N/A | Blocked: no frontend API client |
| 7. Load / performance / stress | 0 | 0 | Not run | N/A | Blocked: no staging target supplied |
| 8. Accessibility | 0 | 0 | Not run | N/A | Blocked: no frontend |
| 9. Visual regression | 0 | 0 | Not run | N/A | Blocked: no frontend |
| 10. Mutation | 718 mutants planned | No final result | Aborted at 395/718; 66 survived and 6 timed out at abort | No valid mutation score | Incomplete: Windows process termination failed with `spawn EPERM` |
| 11. Smoke | 0 tagged smoke tests | 0 | Not run | N/A | Not implemented |

Coverage was run separately with instrumentation enabled. The integration runner reported **86.27% statements, 61.60% branches, and 88.42% lines**. The unit runner reported **87.47% statements, 74.14% branches, and 91.22% lines**. Unit and integration suites were run once as a complete set in parallel; the recorded Jest times were **60.571 seconds** for integration and **13.081 seconds** for unit tests. A second unchanged complete run was not achieved, so suite-wide flakiness is unknown.

**Coverage gaps:** `src/services/menu.service.ts` was **57.14% line-covered** in the integration run (it was 83.67% in the unit run). No controller or middleware file was below 70% line coverage in either reported table. `src/lib/type-guards.ts` was 60% line-covered in the integration run; it is outside the controller/service/middleware categories requested. Integration branch coverage is low at 61.60%, despite line coverage.

## Findings and fixes

| Layer | Severity | Finding and reproduction | Resolution |
|---|---|---|---|
| 4 | High | Concurrent requests could silently overwrite the same order/table status. | Chose optimistic compare-and-set: status updates provide `expectedStatus`; a stale update receives 409. Concurrent order and table status tests verify the conflict response. |
| 3/4 | High | Refresh tokens were reusable, and access JWTs could not be revoked by refresh-token replay. | Added persisted refresh-token hashes, family identifiers, one-time rotation, replay detection, a security-event warning, all-user-session revocation, and access-session checks. Integration tests verify replay rejection and invalidation of access tokens from two login sessions. |
| 2 | Medium | Rotated JWTs issued within one second could have identical claims and collide on the persisted token-hash unique constraint. | Added a unique JWT ID (`jti`) to each refresh JWT. The rotation test now verifies a distinct replacement token. |
| 3 | Medium | An unhandled 500 response previously risked exposing exception details in development. | Fixed to return a generic internal-error response; regression security checks verify internals are not included. |
| 10 | Unresolved | Stryker did not finish: Windows process cleanup failed with `spawn EPERM`. At the abort point, 395 of 718 mutants had run; 66 survived and 6 timed out. | No final score or complete survivor list is available. These interim survivors are not classified as equivalent or fixed. |
| 8 | Unresolved | The requested full unit + integration suite was not run twice unchanged. | One complete set passed; flakiness remains unverified. |

### Refresh-token behavior and schema change

Added Prisma model `RefreshToken` and relation `User.refreshTokens`. The model stores a SHA-256 token hash, user and family IDs, expiration, use/revocation timestamps, replacement hash, and creation time. Raw refresh JWTs are not stored. A successful refresh marks the old token used and persists a new token in the same transaction. Reuse revokes all refresh families for that user and makes their associated access tokens fail authentication. Logout revokes the presented token family.

The schema change was necessary for rotation, replay detection, and persisted session revocation. The test database had a populated schema but no migration history; `prisma migrate dev` initially stopped on detected drift rather than resetting it. The isolated test database was synchronized, a full-schema baseline migration (`prisma/migrations/20261102000000_init`) was generated and marked applied there, and `prisma migrate dev` then reported no pending schema changes. The test database was the only database targeted.

## Concurrency results

- **Stock, repeated contention:** each of three rounds sent 10 simultaneous requests for 3 available units. Each round returned exactly **3 × 201** and **7 × 400**; persisted stock was **0**, never negative.
- **Same-field order status:** two simultaneous distinct status updates now produce one successful compare-and-set and one 409 stale-update conflict; no silent last-write-wins.
- **Same-field table status:** two simultaneous distinct status updates use the same expected-status compare-and-set and conflict behavior.
- **Bill generation:** two simultaneous requests for one order produced exactly **1 × 201** and **1 × 409**; one bill persisted.

These are real simultaneous API requests against the isolated PostgreSQL test database. The current integration suite passed these tests.

## Security endpoint matrix

For each of the following **18 body endpoints**, the suite sends malformed JSON and a real 10 MB JSON body. All malformed bodies returned **400 `BAD_JSON`**; all oversized bodies returned **413 `PAYLOAD_TOO_LARGE`**, with no internal paths or stack details in the response:

`POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /tables`, `PATCH /tables/{id}`, `POST /menu/categories`, `POST /menu/items`, `PATCH /menu/items/{id}`, `POST /users`, `POST /orders`, `POST /orders/{id}/items`, `PATCH /orders/{id}/status`, `POST /bills/order/{orderId}`, `PATCH /bills/{id}/pay`, `POST /assistance`, `PATCH /assistance/{id}/resolve`, and `POST /feedback`.

The stored-text SQL/XSS checks cover category names; menu-item names, descriptions, and tags; staff names; order-item notes; and feedback comments. Injection validation also covers the user email field, menu category sort order, menu category/table/order/feedback IDs, assistance type, analytics `days`/`limit`, menu `categoryId`, order `tableId`/`activeOnly`, and assistance `pendingOnly`. Invalid path-ID payloads were exercised on menu-category deletion, menu-item patch/delete, user activate/deactivate, order read/add-items/status, bill read/pay, and assistance resolution. JSON operator-object payloads were rejected in category/menu/user/signup/order/feedback text inputs.

The existing security tests also cover no-token, malformed/expired token, role boundaries, horizontal order/bill access, CORS allow-list behavior, and error-detail disclosure. These checks are focused on the listed endpoints and inputs; they do not prove every possible payload or browser-rendering behavior.

## Test-count discrepancy

The **49-to-51** integration-test increase was due to **two intentional test additions during the concurrency work**, not nondeterministic Jest discovery or registration. The current suite has since grown to 91 cases, including the 38 endpoint parser/injection cases in `tests/security.inputs.test.ts`.

## Load, accessibility, visual, and production readiness

- **Load/WebSockets:** Not run. No staging target was provided. Concurrent-user ceiling, response-time curve, break point, recovery time, and socket broadcast performance are unknown.
- **Accessibility/visual:** Not run; the repository contains no frontend pages or screenshot baselines.
- **Must fix before production readiness:** complete the mutation run and triage every survivor; run the unchanged full suite twice; address the 57.14% integration line coverage in `menu.service.ts` and broader branch gaps; provide frontend/staging targets for the blocked layers.
- **Dependency note:** Installing Stryker reported 29 dependency advisories in the complete dependency tree (4 low, 22 moderate, 3 high). They were not audited or remediated as part of this test-hardening task.
