# Playwright E2E Tests for ESBOT Buzzing System

Comprehensive functional tests that verify actual game logic, state transitions, buzzer behavior, scoring flows, and multi-player interactions.

## What's Tested

### Game State Management
- Buzz button disabled in idle state
- Buzz button enabled after tossup opened and timer started
- Buzz button disabled after someone buzzes

### Buzzer Functionality
- Player can successfully buzz when enabled
- Keyboard shortcuts (Space/Enter) trigger buzz
- Same team cannot buzz twice on same tossup

### Scoring Flow
- Correct answer clears question state
- Incorrect answer allows other team to buzz
- Penalty applies correctly

### Bonus Questions
- Bonus question flow after correct tossup

### Timer Functionality
- Timer starts and counts down
- Timer pauses when player buzzes

### Edge Cases
- Mark dead clears question without scoring

## Prerequisites

1. Dev server running:
   ```bash
   npm run dev
   ```

2. Convex running:
   ```bash
   npx convex dev
   ```

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/gameplay.spec.ts

# Run tests matching a pattern
npx playwright test --grep "mark dead"

# Run in headed mode (see browser)
npx playwright test --headed

# Run with Playwright's inspector/debugger
npx playwright test --debug

# View last test report
npx playwright show-report
```

## Debug Mode

### Enabling Debug Logging

To see detailed debug logs during test execution, use the `DEBUG` environment variable:

```bash
DEBUG=1 npx playwright test
```

**Important:** Use `DEBUG=1`, **NOT** `--debug`. The `--debug` flag is Playwright's own debugger tool that opens the Playwright Inspector for stepping through tests, which is different from our custom debug logging.

### Debug Output Example

With `DEBUG=1` enabled, you'll see detailed logs like:

```
=== Setting up game: Dead Question Test ===
Game setup complete - ID: 70kjunlzds, Join Code: V6SL
Moderator page URL: https://localhost:5173/game/70kjunlzds
Player "DeadPlayer" joining game with code V6SL on team "Team Alpha"
Player "DeadPlayer" joined successfully
Opening tossup question - Category: Biology
Category selector found: true
Question opened successfully
Moderator marking question as dead
Question marked dead
```

Without `DEBUG=1`, tests run silently with minimal output.

### Debug Screenshots

When `DEBUG=1` is enabled, helper functions will also take screenshots at key points:
- After game setup
- After player joins

Screenshots are saved to `test-results/debug-*.png` with timestamps.

## Available Helper Functions

The test suite includes reusable helper functions to simplify test writing and reduce code duplication.

### Setup Functions

#### `setupGame(browser, gameName?): Promise<GameSetup>`
Creates a new game as moderator with two default teams (Team Alpha and Team Beta).

**Example:**
```typescript
const { moderatorPage, moderatorContext, joinCode } = await setupGame(browser, 'My Test Game');
```

#### `joinGameAsPlayer(browser, joinCode, playerName, teamName?): Promise<PlayerSetup>`
Joins a game as a player.

**Example:**
```typescript
// Join a specific team
const { playerPage, playerContext } = await joinGameAsPlayer(browser, joinCode, 'Alice', 'Team Alpha');

// Join as individual
const { playerPage, playerContext } = await joinGameAsPlayer(browser, joinCode, 'Bob');
```

### Moderator Actions

#### `openQuestion(moderatorPage, options)`
Opens a question with specified options.

**Example:**
```typescript
// Open a tossup with Biology category
await openQuestion(moderatorPage, {
    type: 'tossup',
    category: 'Biology'
});

// Open a bonus for Team Alpha
await openQuestion(moderatorPage, {
    type: 'bonus',
    category: 'Physics',
    targetTeam: 'Team Alpha'
});
```

#### Other Moderator Actions:
- `startTimer(moderatorPage)` - Starts the answer timer
- `markCorrect(moderatorPage)` - Marks answer as correct
- `markIncorrect(moderatorPage)` - Marks answer as incorrect
- `markDead(moderatorPage)` - Marks question as dead (clears without scoring)
- `clearBuzz(moderatorPage)` - Clears current buzz

### Player Actions

#### `buzz(playerPage)`
Buzzes in as a player.

**Example:**
```typescript
await buzz(playerPage);
```

#### Utility Functions:
- `isBuzzEnabled(playerPage)` - Check if buzz button is enabled
- `isBuzzDisabled(playerPage)` - Check if buzz button is disabled
- `waitForGameState(playerPage, expectedState, timeout?)` - Wait for state change

## Writing Tests

### Basic Test Structure

```typescript
test('your test name', async ({ browser }) => {
    let moderatorContext: BrowserContext | undefined;
    let playerContext: BrowserContext | undefined;

    try {
        // Setup
        const { moderatorPage, moderatorContext: modCtx, joinCode } = 
            await setupGame(browser, 'Test Game');
        moderatorContext = modCtx;

        const { playerPage, playerContext: playerCtx } = 
            await joinGameAsPlayer(browser, joinCode, 'Player1', 'Team Alpha');
        playerContext = playerCtx;

        // Test actions
        await openQuestion(moderatorPage, { type: 'tossup', category: 'Biology' });
        await buzz(playerPage);
        await startTimer(moderatorPage);
        await markCorrect(moderatorPage);

        // Assertions
        await expect(someElement).toBeVisible();
    } finally {
        // Cleanup
        if (playerContext) await playerContext.close();
        if (moderatorContext) await moderatorContext.close();
    }
});
```

### Multi-Player Tests

```typescript
test('multiple players', async ({ browser }) => {
    let moderatorContext: BrowserContext | undefined;
    let player1Context: BrowserContext | undefined;
    let player2Context: BrowserContext | undefined;

    try {
        const { moderatorPage, moderatorContext: modCtx, joinCode } = 
            await setupGame(browser);
        moderatorContext = modCtx;

        const { playerPage: p1Page, playerContext: p1Ctx } = 
            await joinGameAsPlayer(browser, joinCode, 'Alice', 'Team Alpha');
        player1Context = p1Ctx;

        const { playerPage: p2Page, playerContext: p2Ctx } = 
            await joinGameAsPlayer(browser, joinCode, 'Bob', 'Team Beta');
        player2Context = p2Ctx;

        await openQuestion(moderatorPage, { type: 'tossup' });
        await buzz(p1Page);  // Alice buzzes first
        
        // Bob's buzz button should be disabled
        await expect(p2Page.locator('#buzz')).toBeDisabled();
    } finally {
        if (player2Context) await player2Context.close();
        if (player1Context) await player1Context.close();
        if (moderatorContext) await moderatorContext.close();
    }
});
```

## Tips

1. **Always clean up contexts** in the `finally` block to prevent resource leaks
2. **Use `DEBUG=1`** when developing new tests to see what's happening
3. **Wait for elements** before interacting with them - the helpers include appropriate timeouts
4. **Browser contexts are isolated** - each moderator and player gets their own context with separate cookies/storage
5. **Screenshots are automatic** in debug mode - check `test-results/` for debugging failed tests
