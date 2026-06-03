# Codebase Structure

**Analysis Date:** 2026-02-23

## Directory Layout

```
volleyball-app/
├── server/                          # Node.js/Express backend (deployed separately)
│   ├── server.js                    # Main entry point - Express app initialization
│   ├── package.json                 # Backend dependencies
│   ├── models/                      # Mongoose schemas
│   │   ├── User.js
│   │   ├── Team.js
│   │   ├── Event.js
│   │   ├── PlayerAttribute.js
│   │   ├── PushSubscription.js
│   │   ├── NotificationQueue.js
│   │   ├── Achievement.js
│   │   ├── TeamInvite.js
│   │   └── TrainingPool.js
│   ├── routes/                      # API route handlers
│   │   ├── userRoutes.js            # Auth, profile, registration
│   │   ├── teamRoutes.js            # Team CRUD and management
│   │   ├── eventRoutes.js           # Event creation and attendance
│   │   ├── attributeRoutes.js       # Player ratings and attributes
│   │   ├── notificationRoutes.js    # Notification subscriptions
│   │   ├── achievementRoutes.js     # Achievement tracking
│   │   ├── progressRoutes.js        # Player progress data
│   │   ├── comparisonRoutes.js      # Team/player comparisons
│   │   ├── teamInviteRoutes.js      # Team invitations
│   │   └── trainingPoolRoutes.js    # Training pool management
│   ├── controllers/                 # Business logic handlers
│   │   └── notificationController.js
│   ├── middleware/                  # Express middleware
│   │   └── authMiddleware.js        # JWT verification and role checks
│   ├── services/                    # Reusable business services
│   │   └── achievementService.js
│   ├── utils/                       # Utility functions and background jobs
│   │   ├── webpush.js               # Web push configuration
│   │   ├── notificationQueue.js     # Persistent notification scheduler
│   │   ├── notificationScheduler.js # Legacy scheduler (keep for compatibility)
│   │   ├── emailService.js          # Email operations
│   │   ├── votingDeadlineJob.js     # Voting deadline tracking
│   │   ├── attendanceTrackingJob.js # Attendance after 7 days
│   │   ├── timezoneUtils.js         # German timezone helpers
│   │   ├── dataFixes.js             # Database migration utilities
│   │   └── trainingPoolAutoInvite.js
│   └── scripts/                     # Standalone scripts
│       └── seedData.js              # Database seeding for dev
│
├── client/                          # React PWA frontend (deployed separately)
│   ├── src/
│   │   ├── index.js                 # React root + theme provider + service worker
│   │   ├── App.js                   # Route definitions and layout selection
│   │   ├── index.css                # Global styles
│   │   ├── pages/                   # Full-page components (one per route)
│   │   │   ├── auth/
│   │   │   │   ├── Login.js
│   │   │   │   ├── Register.js
│   │   │   │   ├── CoachRegister.js
│   │   │   │   ├── CoachRegisterAccess.js
│   │   │   │   ├── ForgotPassword.js
│   │   │   │   └── ResetPassword.js
│   │   │   ├── coach/
│   │   │   │   ├── Dashboard.js     # Coach main view
│   │   │   │   ├── Teams.js         # Team list
│   │   │   │   ├── CreateTeam.js
│   │   │   │   ├── EditTeam.js
│   │   │   │   ├── TeamDetail.js
│   │   │   │   ├── Players.js       # Player management
│   │   │   │   ├── CreatePlayer.js
│   │   │   │   ├── PlayerDetail.js
│   │   │   │   ├── AddPlayersToTeam.js
│   │   │   │   ├── PlayerProgress.js
│   │   │   │   ├── Events.js        # Event management
│   │   │   │   ├── CreateEvent.js
│   │   │   │   ├── EditEvent.js
│   │   │   │   ├── EventDetail.js
│   │   │   │   ├── Attributes.js    # Rating management
│   │   │   │   ├── Pools.js         # Training pool management
│   │   │   │   └── ImportMatchesPDF.js
│   │   │   ├── player/
│   │   │   │   ├── Dashboard.js     # Player main view
│   │   │   │   ├── Teams.js
│   │   │   │   ├── TeamDetail.js
│   │   │   │   ├── Events.js
│   │   │   │   ├── EventDetail.js
│   │   │   │   ├── SelfAssessment.js
│   │   │   │   ├── PlayerStatistik.js
│   │   │   │   └── TeamComparison.js
│   │   │   ├── Profile.js           # User profile edit
│   │   │   ├── Home.js              # Landing page
│   │   │   ├── Offline.js           # PWA offline page
│   │   │   └── NotFound.js          # 404 page
│   │   ├── components/              # Reusable components
│   │   │   ├── layout/
│   │   │   │   ├── Layout.js        # Player/common layout with navigation
│   │   │   │   ├── CoachLayout.js   # Coach-specific layout
│   │   │   │   └── PlayerLayout.js
│   │   │   ├── coach/               # Coach-specific components
│   │   │   │   ├── CoachSpeedDial.js
│   │   │   │   ├── EditPlayerDialog.js
│   │   │   │   └── InviteLinkDialog.js
│   │   │   ├── common/              # Shared components
│   │   │   │   ├── NotificationPrompt.js
│   │   │   │   ├── NotificationSettings.js
│   │   │   │   └── PWAInstall.js
│   │   │   ├── AchievementBadge.js
│   │   │   ├── AchievementGallery.js
│   │   │   ├── AchievementNotification.js
│   │   │   ├── AttributeComparison.js
│   │   │   ├── AttributeTimelineChart.js
│   │   │   ├── FeedbackDialog.js
│   │   │   ├── LevelProgressBar.js
│   │   │   ├── LevelSelector.js
│   │   │   ├── MilestoneTimeline.js
│   │   │   ├── PlayerPools.js
│   │   │   ├── PlayerRatingCard.js
│   │   │   ├── ProgressDashboard.js
│   │   │   ├── QuickFeedback.js
│   │   │   ├── RatingBadge.js
│   │   │   ├── RatingProgressHistory.js
│   │   │   ├── RatingSlider.js
│   │   │   ├── SelfAssessmentBadge.js
│   │   │   ├── SelfRatingBanner.js
│   │   │   ├── StrengthsWeaknessesCard.js
│   │   │   ├── SubAttributeGroup.js
│   │   │   ├── TeamPercentileChart.js
│   │   │   ├── TrainingPoolManager.js
│   │   │   └── TrendIndicator.js
│   │   ├── context/                 # React Context providers
│   │   │   ├── AuthContext.js       # Authentication state
│   │   │   ├── TeamContext.js       # Team data management
│   │   │   ├── EventContext.js      # Event data management
│   │   │   ├── AttributeContext.js  # Player ratings
│   │   │   ├── ProgressContext.js   # Player progress
│   │   │   └── ComparisonContext.js # Comparison data
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useTeams.js          # React Query hook for teams
│   │   │   └── useEvents.js         # React Query hook for events
│   │   ├── utils/                   # Utility functions
│   │   │   ├── queryClient.js       # React Query config (5min cache)
│   │   │   ├── pushNotifications.js # Web push integration
│   │   │   ├── clickHandler.js      # PWA click delegation
│   │   │   └── polyfills.js         # Browser API shims
│   │   └── serviceWorkerRegistration.js  # PWA service worker setup
│   ├── public/
│   │   ├── index.html               # HTML entry point
│   │   ├── manifest.json            # PWA manifest
│   │   ├── service-worker.js        # Service worker for offline
│   │   └── _redirects               # Render static site redirects
│   ├── package.json                 # Frontend dependencies
│   └── config-overrides.js          # Webpack customizations
│
├── render.yaml                      # Deployment config (separate frontend + backend)
├── package.json                     # Root scripts for development
├── CLAUDE.md                        # Project guidelines
├── TIMEZONE-FIX-INSTRUCTIONS.md     # Timezone documentation
├── project-status.json              # Project metadata
└── .planning/codebase/              # Generated documentation
    ├── ARCHITECTURE.md
    └── STRUCTURE.md
```

## Directory Purposes

**server/models/:**
- Purpose: Mongoose schema definitions and database models
- Contains: User roles, Team membership, Event management, Notifications, Attributes
- Key pattern: Each model in separate file, exported via `module.exports`

**server/routes/:**
- Purpose: API endpoint definitions and request handlers
- Contains: Route handlers with inline business logic (no separate controllers yet)
- Pattern: Each feature gets a route file, protected by middleware

**server/middleware/:**
- Purpose: Cross-cutting request processing
- Contains: Authentication verification, role-based authorization

**server/utils/:**
- Purpose: Background jobs, email, push notifications, data utilities
- Contains: Scheduled tasks that run independent of HTTP requests
- Critical files: `notificationQueue.js` (persistent scheduler), `webpush.js` (push config)

**client/pages/:**
- Purpose: Full-page components mapped to routes
- Pattern: One component per route, handles all page-level logic
- Organization: `/auth/*`, `/coach/*`, `/player/*` mirrors backend route structure

**client/components/:**
- Purpose: Reusable UI elements and feature-specific components
- Pattern: Components are data-dumb, receive props, call context/hooks
- Layout components wrap children with header/navigation

**client/context/:**
- Purpose: Global state management across multiple pages
- Pattern: React Context API with Provider + Hook, separate from component files
- Usage: Imported in components via `useContext(SomeContext)`

**client/utils/:**
- Purpose: Helper functions, API configuration, service worker integration
- Query client: React Query with 5min stale time, 10min cache
- Push notifications: Browser API integration with server subscription

## Key File Locations

**Entry Points:**
- Backend: `server/server.js` - Express initialization, route registration, job startup
- Frontend: `client/src/index.js` - React root, theme, service worker registration
- Client App: `client/src/App.js` - Router definition, role-based layout selection

**Configuration:**
- Backend env: `server/server.js` (reads from `process.env`)
- Frontend env: `client/src/index.js` and `client/src/context/AuthContext.js` (reads `REACT_APP_API_URL`)
- Deployment: `render.yaml` - Render.com service definitions (frontend static, backend web)

**Core Logic:**
- Authentication: `server/routes/userRoutes.js` (register, login), `client/src/context/AuthContext.js`
- Teams: `server/routes/teamRoutes.js`, `server/models/Team.js`, `client/src/context/TeamContext.js`
- Events: `server/routes/eventRoutes.js`, `server/utils/notificationQueue.js` (scheduling)
- Attributes: `server/routes/attributeRoutes.js`, `server/models/PlayerAttribute.js`

**Testing:**
- Test files: Not present (testing not yet implemented)
- Seeding: `server/scripts/seedData.js` for development database population

## Naming Conventions

**Files:**
- Backend routes: `featureRoutes.js` (e.g., `userRoutes.js`, `teamRoutes.js`)
- Backend models: `ModelName.js` (e.g., `User.js`, `Team.js`)
- Frontend pages: `PageName.js` (e.g., `Dashboard.js`, `CreateTeam.js`)
- Frontend components: `ComponentName.js` (PascalCase)
- React Context files: `FeatureContext.js` (e.g., `AuthContext.js`, `TeamContext.js`)
- Utility files: `camelCase.js` (e.g., `webpush.js`, `queryClient.js`)

**Directories:**
- Feature-grouped: Routes, models organized by feature (user, team, event)
- Structural grouping: Components grouped by type (pages, context, utils)
- Role-based: Coach pages in `/pages/coach/`, player pages in `/pages/player/`

**Exports:**
- Models: `module.exports = mongoose.model('ModelName', Schema)`
- Routes: `module.exports = router`
- Contexts: `export const ContextName = createContext()` and `export const ProviderName = ...`
- Utils: `module.exports = { functionName1, functionName2 }` or default export

## Where to Add New Code

**New Feature (e.g., Ratings):**

1. **Backend:**
   - Model: `server/models/FeatureName.js` (Mongoose schema)
   - Routes: `server/routes/featureRoutes.js` (GET, POST, PUT, DELETE endpoints)
   - Middleware: Add to `server/middleware/authMiddleware.js` if new role needed
   - Example: `server/routes/attributeRoutes.js` for rating functionality

2. **Frontend:**
   - Context: `client/src/context/FeatureContext.js` (state management)
   - Pages: `client/src/pages/coach/FeaturePage.js` or `client/src/pages/player/FeaturePage.js`
   - Components: `client/src/components/FeatureComponent.js` (reusable UI)
   - Example: `client/src/pages/coach/Attributes.js` for rating UI

**New Component/Module (e.g., Dialog):**

- Implementation: `client/src/components/FeatureDialog.js`
- Import in parent: Use as `<FeatureDialog open={true} onClose={...} />`
- Pattern: Accept props for control, call context for data

**Utilities:**

- Shared helpers: `client/src/utils/featureUtil.js` (exported as functions)
- Server utilities: `server/utils/featureName.js` (background jobs, helpers)

## Special Directories

**node_modules/:**
- Purpose: Installed dependencies (excluded from git)
- Generated: Yes (npm install)
- Committed: No

**.planning/codebase/:**
- Purpose: Generated documentation (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: Yes (via GSD tools)
- Committed: Yes

**client/build/:**
- Purpose: Production build output
- Generated: Yes (npm run build)
- Committed: No

**server/node_modules/:**
- Purpose: Backend dependencies (separate from root)
- Generated: Yes (npm install --prefix server)
- Committed: No

**.env files:**
- Purpose: Environment variables (secrets, database URIs)
- Location: Not tracked (see .gitignore)
- Files: `.env`, `.env.local`, `.env.test` (create locally)
- Note: `.env.example` shows required variables

## Mobile Layout Requirements

**Coach Pages Must Include:**
- Main container padding-bottom: `pb: 10` to prevent mobile navigation overlap
- Example in `client/src/pages/coach/Players.js`:
  ```jsx
  <Container maxWidth="xl" sx={{ py: 3, pb: 10 }}>
    {/* page content */}
  </Container>
  ```

**Bottom Navigation:**
- Height: 80px (56px nav + padding)
- Fixed at bottom on mobile
- Coach pages must account for this spacing

---

*Structure analysis: 2026-02-23*
