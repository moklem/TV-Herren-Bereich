# Testing Patterns

**Analysis Date:** 2026-02-23

## Test Framework

**Runner:**
- Not currently implemented
- `jest` is available through `react-scripts` (built into Create React App)
- Backend uses: `"test": "echo \"Error: no test specified\" && exit 1"`
- Config: Uses Create React App's default Jest configuration via `react-scripts`

**Assertion Library:**
- None configured (would use Jest's built-in matchers if tests were written)

**Run Commands:**
```bash
# Frontend tests (if implemented)
npm run test              # Run tests in client/ directory (via react-scripts)

# Backend tests
npm run test              # Currently returns error message - no tests defined
```

## Test File Organization

**Location:**
- No test files currently exist in the codebase
- **Recommended pattern (co-located)**: Place tests adjacent to source files
  - Example structure: `src/components/__tests__/PlayerRatingCard.test.js`
  - Or: `client/src/components/PlayerRatingCard.test.js` (same directory)

**Naming:**
- Recommended pattern: `ComponentName.test.js` or `ComponentName.spec.js`
- Should follow Create React App convention: `.test.js` files are automatically detected

**Structure:**
```
client/
├── src/
│   ├── components/
│   │   ├── PlayerRatingCard.js
│   │   └── PlayerRatingCard.test.js          # Co-located test
│   ├── context/
│   │   ├── AttributeContext.js
│   │   └── AttributeContext.test.js
│   ├── pages/
│   │   └── coach/
│   │       ├── Dashboard.js
│   │       └── Dashboard.test.js
│   └── utils/
│       ├── authUtils.js
│       └── authUtils.test.js

server/
├── routes/
│   ├── userRoutes.js
│   └── __tests__/
│       └── userRoutes.test.js
├── models/
│   ├── User.js
│   └── __tests__/
│       └── User.test.js
└── utils/
    └── __tests__/
        └── emailService.test.js
```

## Test Structure (Recommended Pattern)

**Suite Organization:**
```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PlayerRatingCard from './PlayerRatingCard';
import { queryClient } from '../utils/queryClient';

describe('PlayerRatingCard', () => {
  // Wrapper component for providers
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    test('should render player name', () => {
      // Test implementation
    });

    test('should render rating inputs when editable', () => {
      // Test implementation
    });
  });

  describe('editing', () => {
    test('should enable edit mode on button click', async () => {
      // Test implementation
    });

    test('should save changes on save button click', async () => {
      // Test implementation
    });
  });

  describe('validation', () => {
    test('should validate rating is between 1-99', () => {
      // Test implementation
    });
  });
});
```

**Patterns:**
- **Setup**: Use `beforeEach()` to initialize state, clear mocks, and reset component state
- **Teardown**: Use `afterEach()` to clean up subscriptions, timers, and network mocks
- **Assertion pattern**: Prefer semantic queries (`screen.getByRole`, `screen.getByText`)
- **Async testing**: Use `waitFor()` for async operations and state updates
- **Mocking**: Mock external dependencies (API calls, context providers)

## Mocking

**Framework:** Jest (native mocking capabilities)

**Patterns:**

API Mocking:
```javascript
// Mock axios in context or component tests
jest.mock('axios');
import axios from 'axios';

describe('AttributeContext', () => {
  beforeEach(() => {
    axios.post.mockResolvedValue({
      data: {
        overallRating: 75,
        ratings: { Athletik: 70, Aufschlag: 80 }
      }
    });
  });

  test('should fetch player ratings', async () => {
    // Test implementation
  });
});
```

Context Mocking:
```javascript
// Mock context values for component tests
jest.mock('../context/AttributeContext', () => ({
  AttributeContext: {
    Consumer: ({ children }) => children({
      getCoreAttributes: jest.fn(() => [...]),
      loading: false,
      error: null
    })
  }
}));
```

React Query Mocking:
```javascript
// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: { /* mock data */ },
    isLoading: false,
    error: null
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false
  }))
}));
```

**What to Mock:**
- External API calls (axios requests)
- Context providers and their hooks
- React Query hooks (useQuery, useMutation)
- Date/time functions (use `jest.useFakeTimers()`)
- Local storage access
- Browser APIs (fetch, localStorage, window)
- Third-party libraries

**What NOT to Mock:**
- Material-UI components (import directly, they work in tests)
- Custom React hooks (test them with their actual behavior)
- Utility functions (test with real implementation unless they depend on external APIs)
- Router components (use `<BrowserRouter>` or `<MemoryRouter>` wrapper)

## Fixtures and Factories

**Test Data:**
```javascript
// Example fixture factory for Player data
const createMockPlayer = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  name: 'Max Mustermann',
  email: 'max@example.com',
  position: 'Außen',
  role: 'Spieler',
  birthDate: '2004-01-15',
  selfAssessmentData: {
    Athletik: { selfRating: 75, selfLevel: 'Bezirksliga' },
    Aufschlag: { selfRating: 80, selfLevel: 'Bezirksliga' }
  },
  ...overrides
});

// Usage in tests
const player = createMockPlayer({ name: 'Custom Name' });
```

**Location:**
- Create `__tests__/fixtures/` directory at appropriate level
- Example: `client/src/__tests__/fixtures/playerFixtures.js`
- Or co-locate in test file for simple fixtures
- Example: `server/routes/__tests__/fixtures/userData.js`

**Example Fixture File:**
```javascript
// client/src/__tests__/fixtures/attributeFixtures.js
export const mockRatings = {
  Athletik: 75,
  Aufschlag: 80,
  Abwehr: 70,
  Angriff: 85,
  Mental: 72,
  'Grund-Technik': 78,
  Annahme: 68,
  'Positionsspezifisch': 82
};

export const mockPlayerAttribute = {
  _id: '507f1f77bcf86cd799439011',
  playerId: '507f1f77bcf86cd799439012',
  ratings: mockRatings,
  overallRating: 76,
  level: 'Bezirksliga',
  progressionHistory: []
};

export const mockCoachFeedback = {
  attributeName: 'Athletik',
  feedback: 'Gute Fortschritte',
  timestamp: new Date()
};
```

## Coverage

**Requirements:**
- Not enforced (no coverage thresholds configured)
- Recommended target when tests are implemented: 70%+ for critical features
  - Backend: Focus on route handlers, middleware, models
  - Frontend: Focus on components, contexts, utility functions

**View Coverage:**
```bash
# Generate coverage report (when tests exist)
npm test -- --coverage

# Typical output location
coverage/lcov-report/index.html
```

## Test Types

**Unit Tests:**
- **Scope**: Individual functions, utilities, components in isolation
- **Approach**: Mock external dependencies
- **Examples**:
  - Test `calculateOverallRating()` utility with mock player data
  - Test validation functions like `isValidEmail()`
  - Test component rendering with mocked props
- **Location**: `src/utils/__tests__/` or co-located with source

**Integration Tests:**
- **Scope**: Component + context interaction, API calls with full chain
- **Approach**: Use real contexts, mock only external API calls
- **Examples**:
  - Test PlayerRatingCard with real AttributeContext
  - Test event creation form submission flow
  - Test authentication flow (register → login)
- **Location**: `src/__tests__/integration/` or feature-level directories

**E2E Tests:**
- **Framework**: Not currently used
- **Tool**: Would use Cypress, Playwright, or Selenium if added
- **Scope**: Full user workflows from login to data submission
- **Examples**:
  - Complete coach event creation and player invitation
  - Player self-assessment completion flow
  - Training pool access and auto-invite workflow

## Common Patterns

**Async Testing:**
```javascript
// Pattern 1: Using waitFor
test('should load player attributes asynchronously', async () => {
  const { getByText } = render(<PlayerDetail playerId="123" />);

  // Component loads data on mount
  await waitFor(() => {
    expect(getByText('Max Mustermann')).toBeInTheDocument();
  });
});

// Pattern 2: Using act wrapper
import { act } from 'react-dom/test-utils';

test('should update state after async operation', async () => {
  let component;
  await act(async () => {
    component = render(<MyComponent />);
  });

  await act(async () => {
    fireEvent.click(component.getByText('Load Data'));
    await waitFor(() => {
      expect(component.getByText('Data Loaded')).toBeInTheDocument();
    });
  });
});

// Pattern 3: Mocking delayed API responses
jest.mock('axios');
axios.post.mockImplementation(() =>
  new Promise(resolve =>
    setTimeout(() => resolve({ data: { success: true } }), 100)
  )
);
```

**Error Testing:**
```javascript
// Pattern 1: Testing error states
test('should display error message on API failure', async () => {
  axios.get.mockRejectedValueOnce(
    new Error('Network error')
  );

  const { getByText } = render(<DataComponent />);

  await waitFor(() => {
    expect(getByText(/error loading data/i)).toBeInTheDocument();
  });
});

// Pattern 2: Testing error boundary with try-catch
test('should handle validation errors gracefully', () => {
  const { getByText, getByRole } = render(<FormComponent />);

  const submitButton = getByRole('button', { name: /submit/i });
  fireEvent.click(submitButton);

  expect(getByText(/email is required/i)).toBeInTheDocument();
});

// Pattern 3: Testing rejection handlers
test('should retry failed requests', async () => {
  axios.post
    .mockRejectedValueOnce(new Error('Failed'))
    .mockResolvedValueOnce({ data: { success: true } });

  const { getByText } = render(<RetryableComponent />);

  await waitFor(() => {
    expect(getByText('Success')).toBeInTheDocument();
  });
});
```

## Testing Strategy by Feature

**For API Routes (Backend):**
- Mock Mongoose models to test logic without DB
- Test status codes and response formats
- Test input validation and error responses
- Test middleware authentication and authorization

**For Components (Frontend):**
- Test rendering with various prop combinations
- Test user interactions (clicks, form submissions)
- Test conditional rendering based on state/props
- Test loading and error states

**For Contexts (Frontend):**
- Test initial state values
- Test hook functions return correct data
- Test state updates and side effects
- Mock axios for API calls

**For Utils (Frontend & Backend):**
- Test with various input combinations
- Test edge cases (null, undefined, empty)
- Test error conditions
- No mocking needed unless external dependencies

## Missing Test Coverage Gaps

**Critical areas needing tests:**
1. **Authentication flow** (`client/src/context/AuthContext.js`)
   - Login/register functionality
   - Token management and refresh
   - Password reset email verification

2. **Player Rating System** (`client/src/components/PlayerRatingCard.js`)
   - Rating validation (1-99 range)
   - Position-specific weight calculations
   - Level progression and advancement
   - Sub-attribute calculations

3. **API Route Handlers** (`server/routes/*.js`)
   - User registration and login
   - Team creation and management
   - Event CRUD operations
   - Player attribute updates

4. **Event Management** (`client/src/pages/coach/CreateEvent.js`)
   - Event creation with validation
   - Recurring event logic
   - Auto-invite mechanisms
   - Voting deadline processing

5. **Training Pool System** (`server/models/TrainingPool.js`)
   - Pool eligibility checking
   - MVP voting and bonus calculations
   - Attendance tracking

---

*Testing analysis: 2026-02-23*
