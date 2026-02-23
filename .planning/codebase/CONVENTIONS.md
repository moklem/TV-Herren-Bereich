# Coding Conventions

**Analysis Date:** 2026-02-23

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `PlayerRatingCard.js`, `TeamComparison.js`)
- Context files: PascalCase with "Context" suffix (e.g., `AttributeContext.js`, `AuthContext.js`)
- Page components: PascalCase with role prefix for coach pages (e.g., `CoachDashboard.js`, `PlayerDashboard.js`)
- Utility/helper files: camelCase (e.g., `authUtils.js`, `clickHandler.js`, `pushNotifications.js`)
- Models: PascalCase (e.g., `User.js`, `PlayerAttribute.js`, `TrainingPool.js`)
- Routes: camelCase with "Routes" suffix (e.g., `userRoutes.js`, `eventRoutes.js`, `attributeRoutes.js`)
- Middleware: camelCase (e.g., `authMiddleware.js`)
- Services: PascalCase with "Service" suffix (e.g., `achievementService.js`)

**Functions:**
- Regular functions: camelCase (e.g., `generateToken`, `loadPlayerAttributes`, `calculateOverallRating`)
- Handler functions: camelCase with "handle" prefix (e.g., `handleCancel`, `handleSave`, `handleEdit`)
- Callback/effect functions: camelCase (e.g., `loadPlayerAttributes`, `fetchUserData`)
- Route handlers: POST/GET/PUT/DELETE followed by camelCase description (e.g., `POST /api/users/register`)

**Variables:**
- State variables: camelCase (e.g., `isEditing`, `saveLoading`, `overallRating`)
- Constants: UPPER_SNAKE_CASE for API URLs and configuration (e.g., `API_URL`, `JWT_SECRET`)
- Private/internal variables: camelCase with leading underscore optional (e.g., `_fixesApplied`)
- Boolean variables: "is", "has", "show" prefix (e.g., `isEditing`, `hasLevelChanged`, `showSelfAssessment`)

**Types:**
- Mongoose schemas: PascalCase (e.g., `UserSchema`, `PlayerAttributeSchema`)
- Context objects: camelCase with lowercase start (e.g., `attributeContext`, `authContext`)
- Component props: camelCase (e.g., `showOverallRating`, `onSave`, `editable`)

## Code Style

**Formatting:**
- No explicit formatter configured (using default JavaScript formatting)
- Indentation: 2 spaces (observed in source files)
- Line length: No specific limit enforced, but aim for readability
- String quotes: Single quotes for strings (React JSX uses implicit JSX format)

**Linting:**
- Tool: ESLint with React and import plugins
- Config location: `client/.eslintrc.js`
- Key rules enforced:
  - `react/prop-types: error` - PropTypes validation required on all components
  - `import/order: warn` - Imports must be ordered by category
  - `react-hooks/rules-of-hooks: error` - React hooks rules strictly enforced
  - `react-hooks/exhaustive-deps: warn` - useEffect dependencies must be complete
  - `no-unused-vars: warn` - Warn on unused variables
  - `no-console: warn` - Allow console.warn and console.error, warn on others
  - `getter-return: error` - Getters must return values

## Import Organization

**Order (enforced by ESLint):**

1. **Builtin/React imports** (at top)
   - `import React` (before all others)
   - Standard library imports: `const path = require('path')`

2. **External dependencies** (alphabetically)
   - `import { QueryClientProvider } from '@tanstack/react-query'`
   - `import axios from 'axios'`
   - Material-UI imports grouped together after other externals

3. **Internal imports** (from project)
   - Context imports: `import { AuthContext } from './context/AuthContext'`
   - Component imports: `import Layout from './components/layout/Layout'`
   - Page imports: `import CoachDashboard from './pages/coach/Dashboard'`

4. **Parent/sibling/index imports**
   - Relative path imports: `import './styles.css'`

**Path Aliases:**
- Module root resolution: `moduleDirectory: ['node_modules', 'src/']` in ESLint config
- No explicit path aliases configured (use relative imports)
- Cross-package: `volleyball-app` references work in monorepo (e.g., `volleyball-app` in package.json)

## Error Handling

**Patterns:**

Client-side (React):
```javascript
try {
  setLoading(true);
  setError(null);
  const res = await axios.post(`/attributes/calculate-overall`, {
    playerId,
    playerPosition
  });
  return res.data;
} catch (err) {
  if (err.response?.status === 404) {
    console.warn('New rating API not deployed yet');
    return null;
  }
  setError(err.response?.data?.message || 'Failed to calculate overall rating');
  console.error('Error calculating overall rating:', err);
  return null;
} finally {
  setLoading(false);
}
```

Server-side (Express):
```javascript
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    // Process logic...
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Coach password verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
```

**Patterns:**
- Always use try-catch blocks for async/await operations
- Set loading state before async calls, reset in finally block
- Provide user-facing error messages in response (no stack traces)
- Log detailed errors to console for debugging (console.error)
- Status codes: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 500 (server error)
- Return early on validation errors with appropriate status code
- Include error message in response body: `{ message: 'Error description' }`

## Logging

**Framework:** Console logging only (no Winston, Morgan, or Bunyan)

**Patterns:**
- HTTP requests: Morgan middleware logs to console in 'dev' format
- Console usage: `console.log()` for info, `console.warn()` for warnings, `console.error()` for errors
- Allowed console methods per ESLint config: warn and error (info suppressed)
- Example patterns:
  ```javascript
  console.error('Error calculating overall rating:', err);
  console.warn('New rating API not deployed yet');
  console.log(`Event reminder sent: ${results.successful} successful`);
  console.log(`Player ${playerId} rating ${playerRating} not in range`);
  ```
- Debug logging: Use console.log with context-specific prefixes: `[API]`, `[DB]`, etc.

## Comments

**When to Comment:**
- Complex algorithms or business logic requiring explanation
- Workarounds or "XXX/TODO/FIXME" items that need attention
- Configuration blocks (e.g., CORS setup, middleware ordering)
- Non-obvious conditional logic or validation rules

**JSDoc/TSDoc:**
- Minimally used in codebase (5 instances found in utils files)
- Focus on key utility functions rather than all functions
- Pattern when used:
  ```javascript
  /**
   * Description of function purpose
   */
  const myFunction = (param) => { ... };
  ```
- Required on exported utility functions: `authUtils.js` uses JSDoc for key functions
- PropTypes serve as documentation for React components

**Example:**
```javascript
/**
 * Verify if user authentication token is valid
 */
const verifyAuthToken = (token) => { ... };
```

## Function Design

**Size:**
- Keep functions under 100 lines for readability
- Break complex logic into smaller, testable functions
- Single responsibility principle: each function does one thing well

**Parameters:**
- Limit to 3-5 parameters maximum
- Use object destructuring for multiple parameters in React components
- Example:
  ```javascript
  const PlayerRatingCard = ({
    player,
    onSave,
    editable = true,
    showOverallRating = true,
    compact = false,
    showSelfAssessment = false
  }) => { ... }
  ```

**Return Values:**
- Explicit return statements (no implicit returns from arrow functions with side effects)
- Return data structures consistent with caller expectations
- Return null for failed async operations with proper error handling
- Use proper HTTP status codes in Express handlers

## Module Design

**Exports:**

Node.js/CommonJS (backend):
```javascript
module.exports = {
  protect,
  coach,
  player
};

// or
module.exports = { startAttendanceTrackingJob, checkAttendanceProcessing };
```

React/ES6 (frontend):
```javascript
export const AttributeContext = createContext();
export const AttributeProvider = ({ children }) => { ... };

// or default export
export default PlayerRatingCard;
```

**Barrel Files:**
- Used for context exports: `export const AuthContext = createContext()`
- Not used for component aggregation (import from specific files)
- Context providers typically wrap multiple related functions/state

## React Component Patterns

**Functional Components:**
- Always use functional components with hooks (no class components)
- Use destructuring for props at component definition
- Use useCallback for memoized functions to prevent infinite loops
- Use useMemo for expensive calculations and stable object references

**Component Structure:**
```javascript
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Component1, Component2 } from '@mui/material';

const MyComponent = ({ prop1, prop2 = defaultValue }) => {
  const [state, setState] = useState(initialValue);

  const handleAction = useCallback(() => {
    // Logic
  }, [dependencies]);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  return (
    <div>
      {/* JSX */}
    </div>
  );
};

MyComponent.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
};

export default MyComponent;
```

**Hooks Usage:**
- `useState`: For component state
- `useEffect`: For side effects with proper dependency arrays
- `useContext`: For accessing context values
- `useCallback`: Wrap event handlers and functions passed as props
- `useMemo`: Wrap expensive calculations and prevent reference changes
- `useReducer`: For complex state logic (not commonly used in this codebase)

---

*Convention analysis: 2026-02-23*
