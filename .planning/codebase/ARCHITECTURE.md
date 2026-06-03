# Architecture

**Analysis Date:** 2026-02-23

## Pattern Overview

**Overall:** Client-Server with separated frontend (React PWA) and backend (Node.js/Express) APIs, deployed independently on Render.com.

**Key Characteristics:**
- Role-based access control (Trainer/Spieler/Jugendspieler)
- JWT-based authentication with token refresh in localStorage
- React Context API for state management across multiple domains
- React Query for server state and caching
- MongoDB as primary data store with Mongoose ORM
- Background jobs for notifications, voting deadlines, and attendance tracking
- PWA with service worker for offline support

## Layers

**API Layer (Backend):**
- Purpose: RESTful endpoints for all client operations
- Location: `server/routes/`
- Contains: Route handlers with role-based middleware (`protect`, `coach`, `player`)
- Depends on: Mongoose models, middleware, utilities
- Used by: Frontend via axios

**Controller/Handler Layer (Backend):**
- Purpose: Business logic for request handling
- Location: `server/routes/*.js` (inline) and `server/controllers/notificationController.js`
- Contains: Request validation, database operations, response formatting
- Depends on: Models, services, utilities
- Used by: Routes

**Model Layer (Backend):**
- Purpose: Data schema definition and validation
- Location: `server/models/`
- Contains: Mongoose schemas with methods like `isYouthPlayer()`, timestamps, relationships
- Key models: `User.js`, `Team.js`, `Event.js`, `PlayerAttribute.js`, `NotificationQueue.js`, `TrainingPool.js`
- Depends on: Mongoose
- Used by: Routes, services, utilities

**Middleware Layer (Backend):**
- Purpose: Cross-cutting concerns for requests
- Location: `server/middleware/authMiddleware.js`
- Contains: JWT verification (`protect`), role checks (`coach`, `player`)
- Applied to: Protected routes

**Service Layer (Backend):**
- Purpose: Reusable business logic (limited use)
- Location: `server/services/` (currently only `achievementService.js`)
- Contains: Domain-specific operations
- Used by: Routes and utilities

**Utility/Job Layer (Backend):**
- Purpose: Background operations and helpers
- Location: `server/utils/`
- Key utilities:
  - `webpush.js`: Web push configuration
  - `notificationQueue.js`: Persistent notification scheduling
  - `notificationScheduler.js`: Legacy scheduler
  - `emailService.js`: Email operations
  - `votingDeadlineJob.js`: Voting deadline checking
  - `attendanceTrackingJob.js`: Attendance after 7 days
  - `timezoneUtils.js`: German timezone handling
  - `dataFixes.js`: Data migration utilities
  - `trainingPoolAutoInvite.js`: Auto-invitation logic

**Presentation Layer (Frontend):**
- Purpose: React components rendering
- Location: `client/src/components/`
- Contains: Reusable UI components, layout wrappers
- Key layouts: `Layout.js` (player), `CoachLayout.js` (coach), `PlayerLayout.js`

**Page Layer (Frontend):**
- Purpose: Full page components for routes
- Location: `client/src/pages/`
- Contains: Coach pages (`/coach/*`), Player pages (`/player/*`), Auth pages (`/auth/*`)
- Key pages: Dashboard, Teams, Players, Events, CreateEvent, EditTeam

**Context/State Management Layer (Frontend):**
- Purpose: Application state sharing across components
- Location: `client/src/context/`
- Key contexts:
  - `AuthContext.js`: User authentication state, login/logout
  - `TeamContext.js`: Team data and operations
  - `EventContext.js`: Event data and operations
  - `AttributeContext.js`: Player attributes and ratings
  - `ProgressContext.js`: Player progress tracking
  - `ComparisonContext.js`: Team/player comparisons

**Hook Layer (Frontend):**
- Purpose: Reusable state and side-effect logic
- Location: `client/src/hooks/`
- Contains: `useTeams.js`, `useEvents.js` (custom React Query hooks)

**Utility Layer (Frontend):**
- Purpose: Helper functions and integrations
- Location: `client/src/utils/`
- Key utilities:
  - `queryClient.js`: React Query configuration (5min stale, 10min cache)
  - `pushNotifications.js`: Web push subscription and handling
  - `clickHandler.js`: Click event delegation for PWA
  - `polyfills.js`: Browser API polyfills

## Data Flow

**Authentication Flow:**

1. User submits credentials at `/login` or `/register`
2. Backend validates, generates JWT, returns user + token
3. Frontend stores in localStorage (`user` object with token)
4. AuthContext verifies token on app load via `GET /api/users/profile`
5. All subsequent requests include `Authorization: Bearer {token}` header via axios interceptor
6. Backend verifies token in `protect` middleware
7. Logout clears localStorage and removes auth header

**Team/Player Data Flow:**

1. Frontend requests teams via `GET /api/teams`
2. Backend checks user role:
   - Trainer: returns all teams (populated with coaches/players)
   - Spieler: returns only teams user belongs to
3. Frontend stores in TeamContext
4. React Query caches for 5 minutes
5. Coach modifies team → `PUT /api/teams/:id`
6. Backend updates Mongoose document
7. Frontend invalidates query cache, refetches

**Event Data Flow:**

1. Coach creates event `POST /api/events` with notification settings
2. Backend creates Event document with `notificationSettings.enabled`
3. NotificationQueue service schedules reminders (1h, 3h, 24h before)
4. Notification job runs and sends web push to subscribed users
5. Players accept/decline attendance
6. Coach views attendance status in event detail page

**Notification Queue:**

1. Event created with notification settings
2. `scheduleEventNotifications()` creates entries in NotificationQueue model
3. `startNotificationQueue()` job runs every minute, finds `status: 'pending'` entries
4. For each entry where `scheduledTime <= now`, sends push to subscribers
5. Updates entry `status: 'sent'` or `status: 'failed'`
6. Retries failed notifications up to configured attempts

**State Management:**

- **Authentication**: AuthContext (global, persistent)
- **Team/Event Data**: Context + React Query (server state)
- **UI State**: Local component state (modals, forms)
- **User Progress**: ProgressContext (player ratings, attributes)

## Key Abstractions

**User Roles:**
- Purpose: Determine permissions and visible features
- Enum: `Trainer` (coach), `Spieler` (player), `Jugendspieler` (youth player)
- Examples: `server/models/User.js` line 19-23
- Pattern: Role checked in middleware (`server/middleware/authMiddleware.js`), routes, and components

**Team Membership:**
- Purpose: Control data visibility and modification
- Implementation: `teams` array in User, `coaches`/`players` arrays in Team
- Authorization: Teams check if user in `players` array (for players) or `coaches` array (for coaches)
- Example: `server/routes/teamRoutes.js` line 86-88

**Event Invitations:**
- Purpose: Track attendance and notifications
- Fields: `attendingPlayers`, `invitedPlayers`, `declinedPlayers` in Event model
- Flow: Coach invites players → NotificationQueue entries created → web push sent

**Attributes/Ratings:**
- Purpose: Track player skill progression
- Model: `PlayerAttribute.js` stores per-player, per-position ratings
- Timeline: Stores history of ratings over time
- Usage: Coach rates players, players self-assess via `SelfAssessment` page

**Training Pools:**
- Purpose: Group players for balanced team selection
- Implementation: `TrainingPool.js` model with league structure
- Auto-invite: `trainingPoolAutoInvite.js` invites players to events

## Entry Points

**Backend Server:**
- Location: `server/server.js`
- Triggers: `npm start` or deployment
- Responsibilities:
  - Initialize Express app
  - Connect to MongoDB
  - Register all routes
  - Start background jobs (notifications, voting deadlines, attendance)
  - Serve health check at `GET /api/health`

**Frontend App:**
- Location: `client/src/index.js`
- Triggers: Browser load
- Responsibilities:
  - Initialize React + Router + Theme
  - Register service worker for PWA
  - Set up AuthProvider + QueryClientProvider
  - Render App component

**Frontend Router:**
- Location: `client/src/App.js`
- Contains: All route definitions
- Pattern: Role-based layout selection (CoachLayout vs PlayerLayout)
- Routes structured as `/coach/*`, `/player/*`, `/auth/*`

## Error Handling

**Strategy:** Try-catch blocks with HTTP status codes and console logging

**Patterns:**

- **400 Bad Request**: Invalid input (missing fields, duplicate resources)
  - Example: `server/routes/teamRoutes.js` line 18 - duplicate team check

- **401 Unauthorized**: Missing or invalid token
  - Handled in `protect` middleware: `server/middleware/authMiddleware.js` line 23
  - Frontend clears auth on 401 response

- **403 Forbidden**: User lacks role or team membership
  - Coach-only endpoints use `coach` middleware
  - Team access checks user in team arrays

- **404 Not Found**: Resource doesn't exist
  - Example: `server/routes/teamRoutes.js` line 81

- **500 Server Error**: Database errors, unhandled exceptions
  - Logged to console
  - Generic "Server error" message returned to client

**Frontend Error Handling:**
- Axios interceptors (configured in `client/src/context/AuthContext.js`)
- Try-catch in async operations
- Loading states prevent user action during requests

## Cross-Cutting Concerns

**Logging:**
- Backend: `morgan` middleware for HTTP logs (dev mode in `server/server.js` line 58)
- Console.log for debug info (timestamps, connection status)
- Production: Morgan logs all requests

**Validation:**
- Mongoose schema validation (required fields, enums)
- Route-level validation (password reset token expiry, role checks)
- Frontend: Form validation via Material-UI components (required fields, email format)

**Authentication:**
- JWT tokens with 30-day expiry
- Secret stored in `process.env.JWT_SECRET`
- Token verified on every protected request
- Frontend refreshes user profile on app load to catch expired tokens

**Authorization:**
- Role-based middleware (`protect`, `coach`, `player`)
- Team membership checks for data isolation
- Coach-only endpoints block non-coach requests

**Timezone Handling:**
- German timezone (CET/CEST) used for event times
- Utilities: `server/utils/timezoneUtils.js`
- Notification scheduling respects timezone
- Frontend displays German locale dates (date-fns-tz)

**Push Notifications:**
- Service worker receives notifications
- Push subscription stored in PushSubscription model
- User preferences tracked (enabled/disabled per notification type)
- NotificationQueue stores pending notifications persistently

---

*Architecture analysis: 2026-02-23*
