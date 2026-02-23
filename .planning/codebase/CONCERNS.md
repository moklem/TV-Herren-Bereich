# Codebase Concerns

**Analysis Date:** 2026-02-23

## Tech Debt

**Large Component Files - High Complexity:**
- Issue: Multiple components exceed 1500 lines of code, mixing presentation logic with state management
- Files: `client/src/pages/coach/EventDetail.js` (1523 lines), `client/src/components/TrainingPoolManager.js` (1214 lines), `client/src/pages/coach/EditEvent.js` (1173 lines), `server/routes/eventRoutes.js` (1615 lines)
- Impact: Difficult to maintain, test, and debug. High cognitive load when reading. Increased risk of bugs during modifications.
- Fix approach: Extract utility functions, separate concerns into smaller components, create reusable hook/utility modules for common patterns

**Silent Error Handling:**
- Issue: Multiple locations silently fail and return null/empty arrays without proper error logging or user feedback
- Files: `client/src/context/AttributeContext.js` (lines 138-146, 162-170), `client/src/context/EventContext.js` (line 143), `client/src/context/TeamContext.js` (line 45)
- Impact: Users cannot distinguish between "no data available" and "API error occurred". Makes debugging production issues very difficult. User doesn't know if action succeeded.
- Fix approach: Implement user-facing error messages, log errors properly, provide retry mechanisms for failed requests

**Implicit Async Race Conditions in State Management:**
- Issue: Multiple `setInterval` and `setTimeout` calls without proper cleanup or coordination can cause duplicate processing
- Files: `server/utils/votingDeadlineJob.js` (lines 235-236, 241-242), `server/utils/notificationScheduler.js` (lines 224, 227), `server/utils/notificationQueue.js` (lines 270, 273, 276)
- Impact: Events could be processed multiple times, notifications sent duplicates, race conditions if multiple instances running. No built-in deduplication for background jobs.
- Fix approach: Implement distributed locks or flags on database records before processing, add unique job identifiers, centralize background job scheduling with proper error recovery

**Loose Input Validation on Request Bodies:**
- Issue: Direct access to `req.body` fields without validation in many routes
- Files: `server/routes/userRoutes.js` (lines 33, 69, 148, 191, 246, 393-405), `server/routes/eventRoutes.js` (multiple locations)
- Impact: Potential for malformed data to be saved, missing required fields accepted, SQL/NoSQL injection vectors if input not sanitized
- Fix approach: Implement schema validation middleware (joi, zod, or yup), validate request format before processing, reject invalid data early with descriptive errors

**Timestamp Cache Busting Anti-Pattern:**
- Issue: Adding `?_t=${Date.now()}` to URLs to prevent caching (EventContext, TeamContext, App.js)
- Files: `client/src/context/EventContext.js` (line 54), `client/src/context/TeamContext.js` (line 32), `client/src/App.js` (line 82)
- Impact: Breaks HTTP caching, increases server load, defeats browser cache optimization, creates redundant network requests
- Fix approach: Use proper HTTP cache headers (ETag, Cache-Control), implement React Query invalidation patterns, remove timestamp parameters

## Known Bugs

**Timezone Handling Edge Cases:**
- Symptoms: Recent fix for DST transitions (Oct 27, 2025) but timezone utilities may have edge cases with recurring events during DST boundaries
- Files: `server/utils/timezoneUtils.js`, `server/routes/eventRoutes.js` (lines 16-24)
- Trigger: Creating recurring events that span DST transitions, or checking event times near midnight
- Workaround: Use explicit UTC times, verify timezone conversion in test cases

**Training Pool Auto-Invite Not Sending Notifications:**
- Symptoms: Auto-invite invites are created but players don't receive notifications
- Files: `server/utils/trainingPoolAutoInvite.js` (line 152 - TODO comment)
- Trigger: When training pool auto-invite conditions are met
- Workaround: Manually notify players through alternative channels

**Event RSVP Status Inconsistency:**
- Symptoms: Event may show different response status to different viewers, players see conflicting RSVP states
- Files: `client/src/context/EventContext.js` (lines 118-147), `server/routes/eventRoutes.js` (multiple RSVP endpoints)
- Trigger: Rapid RSVP changes, viewing same event on multiple devices
- Workaround: Refresh page to get latest state, wait a few seconds before checking status

## Security Considerations

**JWT Secret Fallback to Hardcoded Default:**
- Risk: If JWT_SECRET environment variable is not set, falls back to 'volleyballapp123'
- Files: `server/middleware/authMiddleware.js` (line 15)
- Current mitigation: Render.com environment variables are set, but no validation on startup
- Recommendations: Add startup validation that JWT_SECRET is properly configured, throw error if missing, log warnings if using defaults

**Missing CSRF Protection:**
- Risk: No CSRF token validation on state-changing requests (POST, PUT, DELETE)
- Files: All server routes lack CSRF middleware
- Current mitigation: CORS configuration provides some protection
- Recommendations: Implement CSRF middleware for non-API endpoints, add double-submit cookie pattern for API

**No Request Rate Limiting:**
- Risk: No rate limiting on authentication endpoints, password reset, or any API
- Files: All route files lack rate limiting middleware
- Current mitigation: Render.com infrastructure provides some DDoS protection
- Recommendations: Implement express-rate-limit or similar, configure per-endpoint limits, especially for auth endpoints

**Direct Role-Based Checks Without Middleware Consistency:**
- Risk: Role checking inconsistently applied - some routes check role, others don't
- Files: `server/middleware/authMiddleware.js` (lines 33-48), inconsistent application in routes
- Current mitigation: Public endpoints are few, most require authentication
- Recommendations: Create dedicated middleware for each role, apply consistently to all routes, test role enforcement

**Unvalidated File Upload (PDF Parsing):**
- Risk: PDF upload endpoint accepts files without size/type validation before parsing
- Files: `server/routes/eventRoutes.js` (lines 360-395), using `multer` with no configured size limits
- Current mitigation: PDF parsing errors are caught
- Recommendations: Add file size limits to multer config, validate MIME type, implement file scanning, add to `.gitignore`

## Performance Bottlenecks

**Context Re-renders on Every State Change:**
- Problem: EventContext, TeamContext, AttributeContext update global state on every operation, causing all consumers to re-render
- Files: `client/src/context/EventContext.js`, `client/src/context/TeamContext.js`, `client/src/context/AttributeContext.js` (all context files)
- Cause: Using single context for all related data without memoization, all consumers depend on same state object
- Improvement path: Split contexts by concern (data vs metadata), add React.memo to components, use useCallback for callbacks, consider Redux/Zustand for large apps

**N+1 Query Pattern in Event Auto-Invite:**
- Problem: Loops through training pool players and invites them individually without batch operations
- Files: `server/utils/trainingPoolAutoInvite.js` (lines 113-129), `server/utils/votingDeadlineJob.js` (lines 111-120)
- Cause: Sequential processing of players instead of batch database operations
- Improvement path: Use MongoDB bulkWrite operations, batch updates into single operation, reduce database calls from O(n) to O(1)

**Polling-Based Background Jobs:**
- Problem: checkVotingDeadlines and checkHoursBeforeAutoInvite run every 15 minutes regardless of actual events
- Files: `server/utils/votingDeadlineJob.js` (lines 235-236), `server/utils/notificationScheduler.js` (line 224)
- Cause: Timer-based polling instead of event-driven architecture
- Improvement path: Implement cron jobs with better scheduling, use database triggers where possible, implement message queue (Bull, Bee-Queue) for job processing

**Full Component Reloads on Focus:**
- Problem: Player Dashboard and Events pages refetch ALL data when window regains focus
- Files: `client/src/pages/player/Dashboard.js` (lines 89-90), `client/src/pages/player/Events.js` (lines 89-90)
- Cause: Document visibility change triggers full data fetch instead of incremental sync
- Improvement path: Use React Query's refocus handler, implement differential sync, only refetch changed data

## Fragile Areas

**EventContext and Complex Event Management:**
- Files: `client/src/context/EventContext.js` (660 lines), `client/src/pages/coach/EventDetail.js` (1523 lines), `server/routes/eventRoutes.js` (1615 lines)
- Why fragile: Complex state management with multiple interdependent operations, recurring event generation, auto-invite triggers, voting deadlines, RSVP handling all tightly coupled
- Safe modification: Extract event RSVP logic into separate module, move recurring event generation to backend, separate concerns into smaller utilities
- Test coverage: No automated tests exist; manual testing required for all event operations

**Training Pool Auto-Invite System:**
- Files: `server/utils/trainingPoolAutoInvite.js`, `server/utils/votingDeadlineJob.js` (lines 69-150), event creation/editing flow
- Why fragile: Auto-invite can be triggered from multiple places (deadline job, hours-before job), no deduplication, depends on event state consistency, notification missing (TODO)
- Safe modification: Centralize auto-invite triggering logic, add idempotency checks, complete notification integration before modifying
- Test coverage: No tests; hard to verify behavior without manual event creation and deadline manipulation

**Player Rating and Level System:**
- Files: `server/models/PlayerAttribute.js`, `client/src/components/PlayerRatingCard.js` (969 lines), multiple contexts using it
- Why fragile: Complex weighted calculations, position-specific overrides, level-up mechanics with attribute reset, migration from old system, backwards compatibility code
- Safe modification: Add comprehensive unit tests for calculation functions, separate calculation logic from UI, freeze level mechanics while adding features
- Test coverage: Limited; test file exists (test-level-system.js) but not integrated into test suite

## Scaling Limits

**In-Memory Background Job Scheduling:**
- Current capacity: Single server instance can handle background jobs
- Limit: Only works with single server; if scaled horizontally, duplicate processing occurs
- Scaling path: Implement Redis-based job queue (Bull), use distributed locks, switch to managed service (AWS SQS, Google Cloud Tasks)

**MongoDB without Indexes:**
- Current capacity: Performance acceptable with current user base
- Limit: Queries on votingDeadline, autoDeclineProcessed, and other frequently-checked fields lack indexes
- Scaling path: Add database indexes on commonly queried fields, profile slow queries with MongoDB Atlas monitoring, optimize query patterns

**Context API State Management:**
- Current capacity: Handles current number of users and data
- Limit: Context re-renders all consumers on any state change; inefficient with 50+ simultaneous users
- Scaling path: Migrate to Redux or Zustand for large-scale app, implement context splitting, add selector pattern for efficient subscriptions

**Event Recurring Generation:**
- Current capacity: Can generate 52+ events for year-long weekly recurring
- Limit: All instances generated upfront; memory/database cost increases exponentially with duration
- Scaling path: Generate events on-demand (lazy generation), implement event series as single record with expansion rules, limit user-facing recurrence patterns

## Dependencies at Risk

**date-fns-tz 3.2.0:**
- Risk: Recently added for timezone handling (Oct 28, 2025), not yet battle-tested in production across multiple DST cycles
- Impact: Timezone-dependent features may break during DST transitions or unusual time scenarios
- Migration plan: Monitor for DST issues, have fallback to native Date handling, test 6+ months through multiple DST transitions

**web-push 3.6.7:**
- Risk: Push notification service depends on correct VAPID keys and browser support, no fallback mechanism
- Impact: If VAPID keys are wrong or regenerated, all push notifications fail silently
- Migration plan: Implement email notification fallback, test VAPID key rotation, add monitoring for delivery failures

**pdf-parse 1.1.1:**
- Risk: PDF parsing library used without file size/type validation; could be attack vector
- Impact: Large or malicious PDFs could cause memory exhaustion or parsing errors
- Migration plan: Add file size limits (max 10MB), validate PDF structure before parsing, implement timeout on parsing

## Missing Critical Features

**Automated Testing Framework:**
- Problem: Zero tests exist; project status explicitly states "Not implemented" for unit, integration, and E2E tests
- Blocks: Cannot safely refactor large components, cannot detect regressions, manual testing on every change
- Priority: High - add Jest/Vitest setup with basic unit tests for calculation functions, API endpoints

**API Documentation:**
- Problem: No OpenAPI/Swagger documentation; 10+ route files with 50+ endpoints have no formal specs
- Blocks: Frontend developers can't know exact response format, integration partners can't understand API
- Priority: Medium - generate API docs with Swagger/OpenAPI tools, document response schemas

**Environment Configuration Validation:**
- Problem: No startup validation that required environment variables are set and valid
- Blocks: Silent failures when deploying with missing config, hard to debug production issues
- Priority: High - add env validation on server startup, fail fast with helpful error messages

**Error Monitoring/Alerting:**
- Problem: No Sentry/ErrorTracking integration; errors logged only in server logs
- Blocks: Production errors may go unnoticed, hard to triage issues without user reports
- Priority: Medium - integrate Sentry or similar, set up Slack notifications for critical errors

## Test Coverage Gaps

**User Authentication and Authorization:**
- What's not tested: Login/logout flows, JWT token validation, role-based access control enforcement
- Files: `server/middleware/authMiddleware.js`, `server/routes/userRoutes.js`, `client/src/context/AuthContext.js`
- Risk: Authentication bugs could allow unauthorized access, role checks might be bypassed
- Priority: Critical - add login/logout tests, test role middleware enforcement, test token expiry

**Event RSVP and Deadline Logic:**
- What's not tested: Event RSVP workflows, voting deadline auto-decline, training pool auto-invite triggers
- Files: `server/routes/eventRoutes.js`, `server/utils/votingDeadlineJob.js`, `server/utils/trainingPoolAutoInvite.js`
- Risk: Complex state transitions could have unreachable states or incorrect logic
- Priority: High - test RSVP status changes, mock time-based triggers, test auto-decline logic

**Rating Calculations:**
- What's not tested: Position-weighted rating calculations, level-up mechanics, sub-attribute to main attribute aggregation
- Files: `server/models/PlayerAttribute.js`, `client/src/context/AttributeContext.js`
- Risk: Calculation bugs produce wrong player evaluations, affecting coaching decisions
- Priority: High - add calculation unit tests, test edge cases (all attributes at 1, all at 99), verify position weights sum correctly

**API Endpoint Error Handling:**
- What's not tested: All 500 error responses, input validation rejection, boundary conditions
- Files: All route files
- Risk: Endpoints might crash on unexpected input, return inconsistent error format
- Priority: Medium - test malformed requests, test missing required fields, verify error response consistency

---

*Concerns audit: 2026-02-23*
