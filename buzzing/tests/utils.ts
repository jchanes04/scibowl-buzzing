import { expect, type Page, type BrowserContext, type Browser } from '@playwright/test';

/**
 * Test utilities and fixtures for ESBOT Buzzing System Playwright tests.
 */

// Helper for conditional debug logging
const isDebugMode = () => process.env.DEBUG === 'true' || process.env.DEBUG === '1';
const debugLog = (...args: any[]) => {
    if (isDebugMode()) {
        console.log(...args);
    }
};

/**
 * Game creation settings interface
 */
export interface GameSettings {
    gameName?: string;
    ownerName?: string;
    newTeamsAllowed?: boolean;
    individualsAllowed?: boolean;
    spectatorsAllowed?: boolean;
    defaultTeams?: string[];
    tossupTime?: number;
    bonusTime?: number;
    visualTime?: number;
    tossupPoints?: number;
    bonusPoints?: number;
    penaltyPoints?: number;
}

/**
 * Game info returned after creation
 */
export interface GameSetup {
    moderatorPage: Page;
    moderatorContext: BrowserContext;
    gameId: string;
    joinCode: string;
}

/**
 * Player info returned after joining
 */
export interface PlayerSetup {
    playerPage: Page;
    playerContext: BrowserContext;
    playerName: string;
}

/**
 * Creates a game with the specified settings and returns game info.
 */
export async function createGame(browser: Browser, settings: GameSettings = {}): Promise<GameSetup> {
    debugLog(`\n=== Setting up game: ${settings.gameName} ===`);
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const modPage = await context.newPage();
    await modPage.goto('/create');
    await modPage.waitForLoadState('networkidle');

    // Fill basic info
    await modPage.fill('#game-name-input', settings.gameName || 'Test Game');
    await modPage.fill('#owner-name-input', settings.ownerName || 'Test Moderator');

    async function expandSection(sectionName: string) {
        const button = modPage.getByRole('button', { name: sectionName });
        // Use evaluate to dispatch a real click event
        await button.evaluate((el: HTMLElement) => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
        await modPage.waitForTimeout(600); // Wait for slide animation
    }

    async function clickLabel(labelText: string) {
        const label = modPage.locator(`label:has-text("${labelText}")`);
        await label.waitFor({ state: 'visible', timeout: 1000 });
        await label.click();
    }

    await expandSection('Team Settings');

    if (settings.newTeamsAllowed) {
        await clickLabel('Members can create their own teams that others can join');
    }
    if (settings.individualsAllowed !== false) {
        await clickLabel('Members can join the game on a team of just themselves');
    }
    if (settings.spectatorsAllowed) {
        await clickLabel('Spectators allowed');
    }

    // Default teams
    if (settings.defaultTeams && settings.defaultTeams.length > 0) {
        await expandSection('Default Teams');

        for (const team of settings.defaultTeams) {
            const teamInput = modPage.locator('input[placeholder*="Team"], input[placeholder*="Add"]').first();
            await teamInput.waitFor({ state: 'visible', timeout: 1000 });
            await teamInput.fill(team);
            await modPage.getByRole('button', { name: /add/i }).click();
        }
    }

    // Timer settings
    if (settings.tossupTime || settings.bonusTime || settings.visualTime) {
        await expandSection('Timer Lengths');
        if (settings.tossupTime) await modPage.fill('#tossup-time', String(settings.tossupTime));
        if (settings.bonusTime) await modPage.fill('#bonus-time', String(settings.bonusTime));
        if (settings.visualTime) await modPage.fill('#visual-time', String(settings.visualTime));
    }

    // Point values
    if (settings.tossupPoints !== undefined || settings.bonusPoints !== undefined || settings.penaltyPoints !== undefined) {
        await expandSection('Point Values');
        if (settings.tossupPoints !== undefined) await modPage.fill('#tossup-points', String(settings.tossupPoints));
        if (settings.bonusPoints !== undefined) await modPage.fill('#bonus-points', String(settings.bonusPoints));
        if (settings.penaltyPoints !== undefined) await modPage.fill('#penalty-points', String(settings.penaltyPoints));
    }

    await modPage.click('button[type="submit"]');
    await modPage.waitForURL(/\/game\/[a-zA-Z0-9]+/, { timeout: 15000 });

    const gameId = modPage.url().split('/').pop() || '';

    // Extract join code from the .join-code button in the TopBar
    await modPage.waitForLoadState('networkidle');
    const joinCodeButton = modPage.locator('button.join-code').first();
    await joinCodeButton.waitFor({ state: 'visible', timeout: 10000 });
    const joinCodeText = await joinCodeButton.textContent() || '';
    // The join code is a 6-character alphanumeric string at the start of the button text
    const joinCodeMatch = joinCodeText.trim().match(/^[A-Z0-9]{6}/);
    const joinCode = joinCodeMatch ? joinCodeMatch[0] : '';

    debugLog(`Game setup complete - ID: ${gameId}, Join Code: ${joinCode}`);
    debugLog(`Moderator page URL: ${modPage.url()}`);

    if (isDebugMode()) {
        await modPage.screenshot({ path: `test-results/debug-mod-after-setup-${Date.now()}.png` });
    }

    return { moderatorPage: modPage, moderatorContext: context, gameId, joinCode };
}

/**
 * Team option for joining a game.
 * - 'individual': Play on your own team
 * - 'new-team': Create a new team (requires newTeamName)
 * - { teamName: string }: Join an existing team by name
 */
export type TeamOption = 'individual' | 'new-team' | { teamName: string };

/**
 * Join a game as a player.
 * Creates its own browser context to isolate cookies from other players/moderator.
 * 
 * @param browser - The Playwright Browser instance
 * @param joinCode - The 6-character join code for the game
 * @param playerName - The name for the player
 * @param teamOption - How to join: 'individual', 'new-team', or { teamName: 'Team Name' }
 * @param newTeamName - Required when teamOption is 'new-team', the name for the new team
 */
export async function joinGameAsPlayer(
    browser: Browser,
    joinCode: string,
    playerName: string,
    teamOption: TeamOption = 'individual',
    newTeamName?: string
): Promise<PlayerSetup> {
    const teamDescription = typeof teamOption === 'object'
        ? `on team "${teamOption.teamName}"`
        : teamOption === 'new-team'
            ? `creating new team "${newTeamName}"`
            : '(individual)';
    debugLog(`Player "${playerName}" joining game with code ${joinCode} ${teamDescription}`);

    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const playerPage = await context.newPage();
    await playerPage.goto('/join');

    // Enter join code
    const codeInput = playerPage.locator('input[name="join-code"]');
    await codeInput.click();
    await codeInput.type(joinCode, { delay: 50 });
    await playerPage.locator('form').dispatchEvent('input');

    // Wait for join button and click
    const joinButton = playerPage.locator('#join-game');
    await expect(joinButton).toBeEnabled({ timeout: 15000 });
    await joinButton.click();
    await playerPage.waitForURL(/\/join\/[a-zA-Z0-9]+/, { timeout: 10000 });

    // Fill player name
    await playerPage.fill('#name-input', playerName);

    // Select team based on option
    if (typeof teamOption === 'object' && teamOption.teamName) {
        // Join an existing team by name
        const teamCard = playerPage.locator('.team-card').filter({ hasText: teamOption.teamName }).first();
        await expect(teamCard).toBeVisible({ timeout: 10000 });
        await playerPage.waitForTimeout(200);
        await teamCard.click();
    } else if (teamOption === 'new-team') {
        // Create a new team
        const createTeamCard = playerPage.locator('.team-card').filter({ hasText: 'Create a new team' }).first();
        await expect(createTeamCard).toBeVisible({ timeout: 10000 });
        await playerPage.waitForTimeout(200);
        await createTeamCard.click();

        // Fill in the new team name if provided
        if (newTeamName) {
            const teamNameInput = playerPage.locator('input[placeholder*="team name"], input[name="team-name"]').first();
            await expect(teamNameInput).toBeVisible({ timeout: 5000 });
            await teamNameInput.fill(newTeamName);
        }
    } else {
        // Default: play on my own (individual)
        const playAloneCard = playerPage.locator('.team-card').filter({ hasText: 'Play on my own' }).first();
        await expect(playAloneCard).toBeVisible({ timeout: 10000 });
        await playerPage.waitForTimeout(200);
        await playAloneCard.click();
    }

    // Join the game
    const joinGameBtn = playerPage.locator('#join-game');
    await expect(joinGameBtn).toBeEnabled({ timeout: 5000 });
    await joinGameBtn.click();
    await playerPage.waitForURL(/\/game\/[a-zA-Z0-9]+/, { timeout: 10000 });

    debugLog(`Player "${playerName}" joined successfully`);

    return { playerPage, playerContext: context, playerName };
}

/**
 * Open a question from the moderator page.
 * Supports tossup and bonus questions with optional category and target team.
 */
export async function openQuestion(
    moderatorPage: Page,
    options: {
        type: 'tossup' | 'bonus';
        category?: string;
        targetTeam?: string;
        questionNumber?: number;
    }
): Promise<void> {
    const { type, category, targetTeam, questionNumber } = options;
    debugLog(`Opening ${type} question #${questionNumber || '?'}${category ? ` - Category: ${category}` : ''}${targetTeam ? ` - Target Team: ${targetTeam}` : ''}`);

    // Select question type
    const radioId = type === 'tossup' ? 'tossup-radio' : 'bonus-radio';
    await moderatorPage.locator(`label[for="${radioId}"]`).click({ timeout: 15000 });

    // Scroll down to see the selectors if needed
    await moderatorPage.evaluate(() => window.scrollTo(0, 500));
    await moderatorPage.waitForTimeout(300);

    // Select target team if provided (for bonus questions) - do this FIRST since it's above category
    if (targetTeam) {
        // The team dropdown is inside #target-team-wrapper
        const teamSelectWrapper = moderatorPage.locator('#target-team-wrapper .select-wrapper');
        await expect(teamSelectWrapper).toBeVisible({ timeout: 5000 });
        await moderatorPage.waitForTimeout(200);
        await teamSelectWrapper.click();
        await moderatorPage.waitForTimeout(200);
        // Click the dropdown item inside the svelte-select list
        await moderatorPage.locator('.svelte-select-list .item').filter({ hasText: targetTeam }).first().click();
    }

    // Select category if provided
    if (category) {
        // The category dropdown is the .svelte-select that's NOT the team dropdown
        // Use nth(1) to get the second one (index 1) - the first is the team dropdown
        const categorySelect = moderatorPage.locator('.svelte-select').nth(1);
        await expect(categorySelect).toBeVisible({ timeout: 5000 });
        await moderatorPage.waitForTimeout(200);
        await categorySelect.click();
        await moderatorPage.waitForTimeout(200);
        // Click the dropdown item inside the svelte-select list
        await moderatorPage.locator('.svelte-select-list .item').filter({ hasText: category }).first().click();
    }

    // Set question number if provided
    if (questionNumber !== undefined) {
        const questionNumberInput = moderatorPage.locator('input[type="number"]');
        await questionNumberInput.fill(String(questionNumber));
    }

    // Click "New Question" button
    await moderatorPage.getByRole('button', { name: 'New Question' }).click();

    // Wait for question to open
    await moderatorPage.waitForTimeout(500);
    debugLog('Question opened successfully');
}

/**
 * Buzz in as a player.
 */
export async function buzz(playerPage: Page): Promise<void> {
    debugLog('Player attempting to buzz in');
    const buzzButton = playerPage.locator('#buzz');
    await expect(buzzButton).toBeEnabled({ timeout: 5000 });
    await buzzButton.click();
    debugLog('Player buzzed successfully');
}

/**
 * Start the timer from the moderator page.
 */
export async function startTimer(moderatorPage: Page): Promise<void> {
    const startTimerBtn = moderatorPage.getByRole('button', { name: /start timer/i });
    await expect(startTimerBtn).toBeEnabled({ timeout: 5000 });
    await startTimerBtn.click();
}

/**
 * Mark a question as correct from the moderator page.
 */
export async function markCorrect(moderatorPage: Page): Promise<void> {
    const correctBtn = moderatorPage.getByRole('button', { name: 'Correct', exact: true });
    await moderatorPage.waitForTimeout(200);
    await expect(correctBtn).toBeEnabled({ timeout: 5000 });
    await correctBtn.click();
}

/**
 * Mark a question as incorrect from the moderator page.
 */
export async function markIncorrect(moderatorPage: Page): Promise<void> {
    const incorrectBtn = moderatorPage.getByRole('button', { name: 'Incorrect', exact: true });
    await moderatorPage.waitForTimeout(200);
    await expect(incorrectBtn).toBeEnabled({ timeout: 5000 });
    await incorrectBtn.click();
}

/**
 * Mark a question as dead from the moderator page.
 */
export async function markDead(moderatorPage: Page): Promise<void> {
    debugLog('Moderator marking question as dead');
    const markDeadBtn = moderatorPage.getByRole('button', { name: /mark dead/i });
    await expect(markDeadBtn).toBeEnabled({ timeout: 5000 });
    await markDeadBtn.click();
    debugLog('Question marked dead');
}

/**
 * Clear buzz from the moderator page.
 */
export async function clearBuzz(moderatorPage: Page): Promise<void> {
    const clearBuzzBtn = moderatorPage.getByRole('button', { name: /clear buzz/i });
    await expect(clearBuzzBtn).toBeEnabled({ timeout: 5000 });
    await clearBuzzBtn.click();
}

/**
 * Wait for game state to change (checks for state text on player page).
 */
export async function waitForGameState(
    playerPage: Page,
    expectedState: 'idle' | 'open' | 'buzzed' | 'closed',
    timeout: number = 5000
): Promise<void> {
    // This is a placeholder - adjust based on how your game displays state
    await playerPage.waitForTimeout(timeout);
}

/**
 * Check if buzz button is enabled on player page.
 */
export async function isBuzzEnabled(playerPage: Page): Promise<boolean> {
    const buzzButton = playerPage.locator('#buzz');
    return await buzzButton.isEnabled();
}

/**
 * Check if buzz button is disabled on player page.
 */
export async function isBuzzDisabled(playerPage: Page): Promise<boolean> {
    const buzzButton = playerPage.locator('#buzz');
    return await buzzButton.isDisabled();
}

/**
 * Opens spectate view for a game.
 */
export async function spectateGame(page: Page, gameId: string): Promise<void> {
    await page.goto(`/spectate/${gameId}`);
    await page.waitForLoadState('networkidle');
}

/**
 * Waits for an element to contain specific text.
 */
export async function waitForText(page: Page, selector: string, text: string, timeout = 5000): Promise<void> {
    await page.locator(selector).filter({ hasText: text }).waitFor({ timeout });
}

/**
 * Gets the current timer value from the page.
 */
export async function getTimerValue(page: Page): Promise<{ minutes: number; seconds: number }> {
    const timerText = await page.locator('h2').filter({ hasText: /\d{2}:\d{2}/ }).first().textContent();
    if (!timerText) return { minutes: 0, seconds: 0 };

    const match = timerText.match(/(\d{2}):(\d{2})/);
    if (!match) return { minutes: 0, seconds: 0 };

    return {
        minutes: parseInt(match[1] ?? '0', 10),
        seconds: parseInt(match[2] ?? '0', 10),
    };
}

/**
 * Generates a random string for unique test data.
 */
export function randomString(length = 8): string {
    return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Creates a unique game name for testing.
 */
export function uniqueGameName(prefix = 'Test'): string {
    return `${prefix} Game ${randomString(4)}`;
}
