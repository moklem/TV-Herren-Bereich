# Technology Stack

**Analysis Date:** 2026-02-23

## Languages

**Primary:**
- JavaScript (ES2021+) - Full application (frontend and backend)

**Secondary:**
- None (single-language stack)

## Runtime

**Environment:**
- Node.js 18.x (production requirement)
- Node.js >=14.0.0 (minimum requirement)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 18.2.0 - Frontend UI framework (`/c/Users/morit/.vscode/BA/volleyball-app/client/src/`)
- Express.js 4.18.2 - Backend REST API framework (`/c/Users/morit/.vscode/BA/volleyball-app/server/`)

**State Management & Data:**
- TanStack React Query 5.83.0 - Server state management and caching (`/c/Users/morit/.vscode/BA/volleyball-app/client/package.json`)
- React Router DOM 6.14.2 - Client-side routing (`/c/Users/morit/.vscode/BA/volleyball-app/client/src/App.js`)
- Mongoose 7.5.0 - MongoDB ODM for data modeling (`/c/Users/morit/.vscode/BA/volleyball-app/server/models/`)

**UI Components & Styling:**
- Material-UI (MUI) 5.15.14 - Component library
- MUI Icons Material 5.14.3 - Icon set
- MUI X Date Pickers 6.19.7 - Date/time selection
- Emotion 11.14.0 - CSS-in-JS styling

**Testing & Build:**
- react-scripts 5.0.1 - Create React App build tooling
- react-app-rewired 2.2.1 - Override CRA config without ejecting
- Recharts 3.1.2 - Data visualization/charting

**Development Tools:**
- nodemon 3.0.1 - Development server auto-reload
- concurrently 8.0.1 - Run multiple npm scripts simultaneously
- Morgan 1.10.0 - HTTP request logging middleware

## Key Dependencies

**Critical:**

- `bcryptjs` 2.4.3 - Password hashing for authentication (`/c/Users/morit/.vscode/BA/volleyball-app/server/models/User.js`)
- `jsonwebtoken` 9.0.1 - JWT token generation and validation for API auth
- `cors` 2.8.5 - Cross-Origin Resource Sharing middleware (`/c/Users/morit/.vscode/BA/volleyball-app/server/server.js`)
- `axios` 1.4.0 - HTTP client for frontend API calls with interceptors (`/c/Users/morit/.vscode/BA/volleyball-app/client/src/App.js`)

**Infrastructure:**

- `mongoose` 7.5.0 - MongoDB object modeling and schema validation
- `web-push` 3.6.7 - Web Push Protocol implementation for notifications (`/c/Users/morit/.vscode/BA/volleyball-app/server/utils/webpush.js`)
- `nodemailer` 6.9.8 - Email sending via SMTP, Gmail, Brevo, or custom servers (`/c/Users/morit/.vscode/BA/volleyball-app/server/utils/emailService.js`)
- `multer` 2.0.2 - Multipart form data handling for file uploads (PDF imports)
- `pdf-parse` 1.1.1 - PDF parsing for match data imports (`/c/Users/morit/.vscode/BA/volleyball-app/server/package.json`)

**Utilities:**

- `date-fns` 2.25.0 - Date manipulation utility
- `date-fns-tz` 3.2.0 - Timezone support for date operations
- `dotenv` 16.5.0 - Environment variable configuration (`/c/Users/morit/.vscode/BA/volleyball-app/server/.env.example`)
- `recharts` 3.1.2 - React charting library for player statistics

**PWA & Offline:**

- `workbox-*` (7.0.0 suite) - Service worker toolkit for PWA functionality:
  - `workbox-core` - Core PWA functionality
  - `workbox-precaching` - Asset precaching
  - `workbox-routing` - Request routing
  - `workbox-strategies` - Cache strategies (CacheFirst, StaleWhileRevalidate, NetworkFirst)
  - `workbox-expiration` - Cache expiration policies
  - `workbox-cacheable-response` - Response caching rules
  - `workbox-google-analytics` - Offline Google Analytics
  - `workbox-background-sync` - Background sync queuing
  - `workbox-broadcast-update` - Cache update notifications
  - `workbox-streams` - Stream caching
  - `workbox-navigation-preload` - Navigation preload optimization
  - `workbox-range-requests` - Range request support

**Browser Polyfills:**

- `buffer`, `crypto-browserify`, `https-browserify`, `os-browserify`, `path-browserify`, `process`, `stream-browserify`, `stream-http`, `url`, `util`, `vm-browserify`, `assert`, `http-browserify` - Node.js compatibility polyfills for browser environment

**Development:**

- `eslint` with plugins:
  - `eslint-plugin-react` - React linting
  - `eslint-plugin-react-hooks` - React Hooks rules
  - `eslint-plugin-import` - Import/export linting
- `@babel/*` packages - JavaScript transpilation and AST manipulation:
  - `@babel/parser` - Code parsing
  - `@babel/traverse` - AST traversal
  - `@babel/generator` - Code generation
  - `@babel/types` - AST type definitions
  - `@babel/plugin-proposal-optional-chaining` - Optional chaining support
  - `@babel/plugin-proposal-nullish-coalescing-operator` - Nullish coalescing support

## Configuration

**Environment:**

Backend configuration via `.env` file at `/c/Users/morit/.vscode/BA/volleyball-app/server/.env.example`:

- `NODE_ENV` - Environment mode (production/development)
- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - Secret key for JWT signing
- `CORS_ORIGIN` - Frontend origin for CORS validation (https://inteamfe.onrender.com)
- `FRONTEND_URL` - Frontend base URL for email links
- `COACH_REGISTRATION_PASSWORD` - Password for coach registration
- Email service configuration (Brevo/Gmail/SMTP):
  - `BREVO_EMAIL`, `BREVO_API_KEY` (recommended)
  - `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS` (Gmail alternative)
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (custom SMTP)
  - `EMAIL_FROM` - Sender email address
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` - Web Push notification keys

Frontend configuration via `.env` at `/c/Users/morit/.vscode/BA/volleyball-app/client/.env`:

- `REACT_APP_API_URL` - Backend API base URL (https://inteam.onrender.com/api)

**Build:**

- `render.yaml` - Render.com deployment configuration (`/c/Users/morit/.vscode/BA/volleyball-app/render.yaml`)
  - Backend service: Node.js runtime in Frankfurt region
  - Frontend service: Static site with build caching and rewrite rules
- `.eslintrc.js` - ESLint configuration for code quality (`/c/Users/morit/.vscode/BA/volleyball-app/client/.eslintrc.js`)

## Platform Requirements

**Development:**

- Node.js 18.x or compatible
- npm package manager
- MongoDB Atlas account (for development database)
- (Optional) Brevo account for email service testing
- (Optional) Web Push VAPID keys for notification testing

**Production:**

- Render.com deployment platform (Frankfurt region)
- MongoDB Atlas for data persistence
- Email service (Brevo recommended, configurable)
- Web Push VAPID keys for push notifications
- Service Worker support in browser (for PWA functionality)

## Scripts

**Root Package** (`/c/Users/morit/.vscode/BA/volleyball-app/package.json`):

- `npm start` - Start production server
- `npm run server` - Run backend with nodemon (development)
- `npm run client` - Run frontend with react-scripts (development)
- `npm run dev` - Run both frontend and backend concurrently
- `npm run install-all` - Install dependencies for root, server, and client
- `npm run build` - Build frontend React app
- `npm run heroku-postbuild` - Legacy Heroku build script

**Client Package** (`/c/Users/morit/.vscode/BA/volleyball-app/client/package.json`):

- `npm start` - Start React development server (port 3000)
- `npm run build` - Create optimized production build
- `npm test` - Run tests with react-scripts
- `npm run lint` - Run ESLint on all source files
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run imports:fix` - Fix import statement formatting
- `npm run imports:proptypes:fix` - Fix imports and PropTypes
- `npm run cleanup` - Run code cleanup scripts

**Server Package** (`/c/Users/morit/.vscode/BA/volleyball-app/server/package.json`):

- `npm start` - Start production server
- `npm run dev` - Start with nodemon for development
- `npm run seed` - Run database seed script
- `npm run build` - No-op build command
- `npm test` - Placeholder test command

---

*Stack analysis: 2026-02-23*
