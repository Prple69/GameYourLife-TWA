# Testing Patterns

**Analysis Date:** 2026-03-01

## Test Framework

**Status:** No test framework configured

**Runner:**
- Not detected
- No jest.config.*, vitest.config.* or test scripts in package.json

**Assertion Library:**
- Not detected

**Run Commands:**
- No test commands available in `frontend/package.json`
- Backend has no test configuration in `requirements.txt` or `main.py`

## Test File Organization

**Status:** No test files present

**Location:**
- No `*.test.js`, `*.test.jsx`, `*.spec.js`, `*.spec.jsx` files found
- No `tests/`, `__tests__/`, or similar directories

**Naming Convention:**
- Not established (no test files to reference)

**Structure:**
- Not applicable

## Testing Approach

**Current State:**
- No automated testing framework in place
- No unit tests, integration tests, or E2E tests detected
- Testing likely manual (browser/Telegram WebApp testing)

## Code Coverage

**Requirements:** Not enforced

**Coverage Tools:** Not installed

## Recommended Test Structure (if implementing)

**Frontend Jest/Vitest Setup** (proposed pattern based on codebase):

```javascript
// Example: components/__tests__/Header.test.jsx
import { render, screen } from '@testing-library/react';
import Header from '../Header';

describe('Header Component', () => {
  it('renders title and subtitle', () => {
    render(<Header title="Test Title" subtitle="Test Subtitle" gold={100} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders gold amount when provided', () => {
    render(<Header title="Title" gold={50} />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('does not render gold when undefined', () => {
    const { container } = render(<Header title="Title" />);
    expect(container.querySelector('[class*="gold"]')).not.toBeInTheDocument();
  });
});
```

**Backend Pytest Setup** (proposed pattern):

```python
# Example: tests/test_crud.py
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas

@pytest.mark.asyncio
async def test_create_user(db: AsyncSession):
    """Test user creation with default values"""
    user = await crud.create_user(db, "123456789", "TestUser")
    assert user.telegram_id == "123456789"
    assert user.username == "TestUser"
    assert user.lvl == 1
    assert user.gold == 0

@pytest.mark.asyncio
async def test_get_user_by_tg_id(db: AsyncSession):
    """Test retrieving user by Telegram ID"""
    await crud.create_user(db, "987654321", "Hero")
    user = await crud.get_user_by_tg_id(db, "987654321")
    assert user is not None
    assert user.telegram_id == "987654321"
```

## Mocking Strategy (not currently used)

**Framework:** Not configured

**Patterns to implement:**

- **API Mocking:**
  - Frontend could use `jest.mock()` or `vitest.mock()` for axios calls
  - Mock `userService` and `questService` in component tests

**Example:**
```javascript
jest.mock('../services/api', () => ({
  userService: {
    getProfile: jest.fn().mockResolvedValue({
      id: 1,
      telegram_id: "123",
      username: "TestUser",
      lvl: 1,
      gold: 0,
      hp: 100
    })
  }
}));
```

- **Database Mocking:**
  - Backend should mock AsyncSession for unit tests
  - Use SQLAlchemy's in-memory SQLite for integration tests

## Fixtures and Test Data

**Status:** Not implemented

**Proposed Pattern (Backend):**

Location: `backend/tests/fixtures.py`

```python
import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models

@pytest.fixture
async def test_user(db: AsyncSession):
    """Create a test user with default values"""
    user = await crud.create_user(db, "test_tg_123", "TestPlayer")
    yield user
    # Cleanup (optional)

@pytest.fixture
async def test_quest(test_user, db: AsyncSession):
    """Create a test quest for test user"""
    quest_data = schemas.QuestSave(
        title="Test Quest",
        difficulty="medium",
        xp_reward=40,
        gold_reward=20,
        hp_penalty=10
    )
    quest = await crud.create_quest(db, test_user.telegram_id, quest_data)
    yield quest
```

## Test Types

**Unit Tests** (recommended approach):

- **Scope:** Individual functions/components in isolation
- **Frontend example - Header component:**
  - Test props rendering
  - Test conditional gold display
  - Test styling classes applied

- **Backend example - Game logic:**
  - Test XP calculation with multipliers
  - Test level-up logic
  - Test reward distribution

**Integration Tests** (recommended):

- **Scope:** Multi-component flows
- **Frontend example:**
  - Quest creation flow: form input → API call → UI update
  - Avatar selection: state update → API call → component re-render
  - Data loading sequence: async asset load → API call → UI render

- **Backend example:**
  - User profile creation flow: create user → verify default values → retrieve by ID
  - Quest completion: create quest → mark complete → verify XP/gold awarded and level-up triggered
  - AI analysis integration: send quest data → parse AI response → save to DB

**E2E Tests** (currently not used):

- Framework: Not configured
- Could use Playwright or Cypress for Telegram WebApp testing
- Would verify complete user flows in actual environment

## Common Async Patterns

**Frontend async pattern** (current codebase):

```javascript
// Inside useEffect hook
const initializeApp = async () => {
  try {
    const apiPromise = userService.getProfile(userData.id, userData.username);
    const videoPromises = videosToLoad.map(async (v) => {
      // async operation
    });

    const [userRes] = await Promise.all([
      apiPromise,
      ...videoPromises
    ]);

    if (!userRes) throw new Error("USER_NOT_FOUND");
    setCharacter(userRes);
  } catch (err) {
    setError(err.message);
  }
};

initializeApp();
```

**Test for async component:**
```javascript
it('loads user data on mount', async () => {
  const mockUser = { id: 1, lvl: 5, gold: 100 };
  userService.getProfile.mockResolvedValue(mockUser);

  render(<App />);

  await waitFor(() => {
    expect(screen.getByText('lvl: 5')).toBeInTheDocument();
  });
});
```

**Backend async pattern** (current codebase):

```python
@app.get("/api/user/{tg_id}")
async def get_profile(tg_id: str, db: AsyncSession = Depends(database.get_db)):
    try:
        user = await crud.get_user_by_tg_id(db, tg_id)
        if not user:
            user = await crud.create_user(db, tg_id, username)
        return user
    except Exception as e:
        logger.error(f"Error getting profile: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
```

**Test for async endpoint:**
```python
@pytest.mark.asyncio
async def test_get_profile_creates_new_user(client, db):
    response = await client.get("/api/user/new_tg_id?username=NewUser")
    assert response.status_code == 200
    assert response.json()["username"] == "NewUser"
    assert response.json()["lvl"] == 1
```

## Error Testing

**Frontend error pattern:**

```javascript
// Current pattern
const handleAvatarChange = useCallback(async (avatarId) => {
  try {
    setCharacter(prev => ({ ...prev, selected_avatar: avatarId }));
    const updatedUser = await userService.updateAvatar(character.telegram_id, avatarId);
    if (updatedUser) setCharacter(updatedUser);
  } catch (err) {
    console.error(err);
    setCharacter(prev => ({ ...prev, selected_avatar: oldAvatar }));
  }
}, [...dependencies]);
```

**Proposed test:**
```javascript
it('reverts avatar on API error', async () => {
  userService.updateAvatar.mockRejectedValue(new Error('API failed'));

  render(<CharacterPage character={mockCharacter} setCharacter={setMock} />);

  fireEvent.click(screen.getByTestId('avatar-selector'));
  await user.click(screen.getByTestId('avatar2'));

  await waitFor(() => {
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ selected_avatar: 'avatar1' })
    );
  });
});
```

**Backend error pattern:**

```python
# Current pattern with fallback
@app.get("/api/quests/{tg_id}")
async def get_quests(tg_id: str, db: AsyncSession = Depends(database.get_db)):
    try:
        quests = await crud.get_active_quests(db, tg_id)
        if quests is None:
            return []
        return quests
    except Exception as e:
        logger.error(f"Error fetching quests for {tg_id}: {e}")
        return []
```

**Proposed test:**
```python
@pytest.mark.asyncio
async def test_get_quests_returns_empty_list_on_error(client, monkeypatch):
    """Verify fallback behavior when database fails"""
    async def mock_get_quests(*args, **kwargs):
        raise Exception("DB Connection failed")

    monkeypatch.setattr(crud, "get_active_quests", mock_get_quests)

    response = await client.get("/api/quests/test_tg_123")
    assert response.status_code == 200
    assert response.json() == []
```

## Coverage Targets (recommended)

**Frontend:**
- Components: 80%+ coverage
- Services: 90%+ coverage (critical business logic)
- Utils: 85%+ coverage

**Backend:**
- CRUD operations: 90%+ coverage
- Game logic (XP, level-up): 95%+ coverage
- API endpoints: 85%+ coverage
- Error handlers: 100% (all error paths)

## Test Execution (proposed)

```bash
# Frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm test                  # Run all tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # Generate coverage report

# Backend
pip install pytest pytest-asyncio httpx
pytest                    # Run all tests
pytest -v               # Verbose output
pytest --cov=app        # With coverage
pytest -k test_crud     # Run specific test
```

---

*Testing analysis: 2026-03-01*

**Note:** This codebase currently has no automated testing infrastructure. The patterns outlined above reflect industry best practices for testing frameworks suitable to the React/FastAPI stack present in the code. Implementation of testing infrastructure is recommended to ensure code quality and prevent regressions.
