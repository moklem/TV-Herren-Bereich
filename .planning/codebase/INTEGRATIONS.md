# External Integrations

**Analysis Date:** 2026-02-23

## APIs & External Services

**Email Service:**
- Brevo (Sendinblue) - SMTP-based email delivery (RECOMMENDED)
  - SDK/Client: nodemailer 6.9.8 with Brevo SMTP relay
  - Auth: `BREVO_EMAIL` and `BREVO_API_KEY` environment variables
  - Implementation: `server/utils/emailService.js`
  - Fallback support for Gmail, custom SMTP servers
  - Brevo SMTP Host: `smtp-relay.brevo.com:587`

**Web Push Notifications:**
- Web Push Protocol (W3C standard)
  - SDK/Client: web-push 3.6.7 (`server/utils/webpush.js`)
  - Auth: VAPID keys (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`)
  - Configuration: `server/utils/webpush.js` - configureWebPush() function
  - Service Worker: `client/src/service-worker.js` for client-side subscription
  - Backend scheduler: `server/utils/notificationScheduler.js` and `server/utils/notificationQueue.js`
  - Push subscriptions stored in `PushSubscription` model

**PDF Processing:**
- PDF file uploads for match data import
  - SDK/Client: pdf-parse 1.1.1
  - Multer 2.0.2 for file upload handling
  - Implementation: `server/routes/eventRoutes.js` (ImportMatchesPDF endpoint)
  - Page: `client/src/pages/coach/ImportMatchesPDF`

## Data Storage

**Databases:**

- MongoDB Atlas (Cloud)
  - Connection: `MONGO_URI` environment variable (mongodb+srv://)
  - Client: Mongoose 7.5.0 ODM
  - Collections/Models:
    - `User` (`server/models/User.js`) - Authentication and user profiles
    - `Team` (`server/models/Team.js`) - Team management
    - `Event` (`server/models/Event.js`) - Team events/matches
    - `PlayerAttribute` (`server/models/PlayerAttribute.js`) - Player skill ratings
    - `PushSubscription` (`server/models/PushSubscription.js`) - Notification subscriptions
    - `NotificationQueue` (`server/models/NotificationQueue.js`) - Pending notifications
    - `TeamInvite` (`server/models/TeamInvite.js`) - Team invitations
    - `Achievement` (`server/models/Achievement.js`) - Player achievements
    - `TrainingPool` (`server/models/TrainingPool.js`) - Training group management
  - Features: Indexing, schema validation, data relationships via refs

**File Storage:**

- Local filesystem only - Files stored on Render.com filesystem
- No external cloud storage (S3, GCS, etc.)
- No persistent file storage (files lost on container restart)

**Caching:**

- Browser-side caching via Workbox service worker:
  - API responses: StaleWhileRevalidate strategy, 30-day expiration, max 50 entries (`service-worker.js`)
  - Images: CacheFirst strategy, 30-day expiration, max 60 entries
  - Navigation: NetworkFirst strategy, failure fallback to cached `/index.html`
- React Query client-side cache: `queryClient` configuration in `client/src/utils/queryClient.js`
- No server-side caching (Redis, Memcached)

## Authentication & Identity

**Auth Provider:**

- Custom JWT-based authentication (self-managed)
  - Implementation: `server/models/User.js` and `server/routes/userRoutes.js`
  - Token generation: jsonwebtoken 9.0.1
  - Secret: `JWT_SECRET` environment variable
  - Token storage: localStorage in browser (`user` object with `token` property)
  - Password hashing: bcryptjs 2.4.3 with salt rounds
  - Axios interceptor: Automatic token injection in `Authorization: Bearer <token>` header (`client/src/App.js`)

**Auth Flow:**

1. Login endpoint: `POST /api/users/login` - Returns user object with JWT token
2. Register endpoints:
   - `POST /api/users/register` - Player/Youth player self-registration
   - `POST /api/users/register-coach` - Coach registration with password
3. Password reset: `POST /api/users/forgot-password` - Email reset link
4. Token validation: Middleware checks Authorization header on protected routes

**Roles:**

- `Trainer` - Coach/team manager
- `Spieler` - Adult player
- `Jugendspieler` - Youth player

## Monitoring & Observability

**Error Tracking:**

- None (no Sentry, Rollbar, or similar integration)
- Console logging only: console.warn(), console.error()

**Logs:**

- Server-side:
  - Morgan 1.10.0 middleware logs all HTTP requests (dev format)
  - Custom console.log() in utility functions
  - Notification scheduler logs: `server/utils/notificationScheduler.js`
  - Email service logs: `server/utils/emailService.js`
- Client-side:
  - React Query DevTools in development: `client/src/App.js`
  - Console warnings for authentication, routing

**Health Check:**

- Endpoint: `GET /api/health` - Status, environment, and version info
- Used by Render.com for deployment health checks

## CI/CD & Deployment

**Hosting:**

- Render.com (Frankfurt region)
- Two separate services deployed from `render.yaml`:
  1. **Backend Web Service** (`volleyball-app-backend`)
     - Runtime: Node.js 18.17.0
     - Start command: `cd server && node server.js`
     - Build command: `./server/render-build.sh`
     - Port: 5000
     - Health check: `/api/health`
     - Environment variables: NODE_ENV, MONGO_URI, JWT_SECRET, PORT, CORS_ORIGIN
  2. **Frontend Static Site** (`volleyball-app-frontend`)
     - Build command: `cd client && npm ci && npm run build && cp public/_redirects build/_redirects`
     - Static path: `./client/build`
     - SPA routing: All requests rewritten to `/index.html`
     - Cache headers configured for index.html and service-worker.js (no-cache)
     - Static assets cached for 1 year
     - Environment variables: REACT_APP_API_URL

**CI Pipeline:**

- None detected (manual deployments via Render.com dashboard or git push)
- No GitHub Actions, GitLab CI, or Jenkins configuration

**Build Process:**

- Frontend: Create React App build system (webpack via react-scripts)
  - Output: Optimized bundle in `client/build/`
  - Service Worker injection: Automatic via Workbox
- Backend: No build step required (plain Node.js)

## Environment Configuration

**Required Environment Variables - Backend:**

Critical for production:
- `MONGO_URI` - MongoDB Atlas connection string (mongodb+srv://username:password@cluster.mongodb.net/database)
- `JWT_SECRET` - Secret key for JWT signing (auto-generated by Render if not set)
- `CORS_ORIGIN` - Frontend origin (https://inteamfe.onrender.com for production)

Optional (email service):
- `BREVO_EMAIL` - Brevo account email
- `BREVO_API_KEY` - Brevo SMTP API key
- OR `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS` (Gmail, Outlook, etc.)
- OR `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (custom SMTP)
- `EMAIL_FROM` - Sender email address

Optional (notifications):
- `VAPID_PUBLIC_KEY` - Web Push public key
- `VAPID_PRIVATE_KEY` - Web Push private key
- `VAPID_SUBJECT` - Web Push subject (mailto:email@example.com)

Optional (features):
- `COACH_REGISTRATION_PASSWORD` - Password for coach self-registration
- `FRONTEND_URL` - For email links (https://inteamfe.onrender.com)

**Required Environment Variables - Frontend:**

- `REACT_APP_API_URL` - Backend API base URL (https://inteam.onrender.com/api)
- NOTE: This is build-time configuration - changes require rebuild

**Test Environment Variables:**

For test/staging deployment:
- `REACT_APP_API_URL` - Test API: https://inteam-test-backend-2.onrender.com/api
- Backend `CORS_ORIGIN` - Test frontend: https://inteam-test.onrender.com

**Secrets Location:**

- Render.com Environment Variables panel for deployed services
- Example file: `server/.env.example` (contains placeholders, never committed with real values)
- Never committed: `.env` files in `server/` and `client/`

## Webhooks & Callbacks

**Incoming:**

- None detected (no webhook endpoints for external services)

**Outgoing:**

- Email notifications: Sent via Brevo SMTP (configured in `server/utils/emailService.js`)
- Push notifications: Sent via Web Push Protocol to browser service workers
- No outbound webhooks to external APIs

## Data Flow Summary

**Authentication Flow:**
1. User login → `POST /api/users/login`
2. Backend returns JWT token
3. Client stores token in localStorage
4. Axios interceptor adds `Authorization: Bearer <token>` to all requests

**Notification Flow:**
1. Coach creates event or sends invitation
2. Backend stores notification metadata in NotificationQueue
3. Scheduler checks pending notifications every 5 minutes
4. For each due notification:
   - Send push notification via web-push
   - Send email via Brevo/configured email service
5. Client displays toast notifications
6. Service worker handles push notifications offline

**Data Persistence:**
1. Frontend: React Query caches server state with stale-while-revalidate
2. Service Worker: Workbox caches API responses and assets
3. Backend: All persistent data to MongoDB Atlas
4. Browser: localStorage for user session token

---

*Integration audit: 2026-02-23*
