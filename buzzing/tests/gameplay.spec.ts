import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import {
    createGame,
    joinGameAsPlayer,
    openQuestion,
    markDead,
    buzz,
    markCorrect,
    markIncorrect,
} from './utils';

/**
 * Comprehensive gameplay tests that verify actual game functionality,
 * state transitions, and interactions between moderator and players.
 * 
 * These tests focus on:
 * - Game state management (idle, open, buzzed)
 * - Buzzer functionality in different states
 * - Moderator scoring actions
 * - Multi-player interactions
 * - Edge cases and error handling
 */

// Helper for conditional debug logging
const isDebugMode = () => process.env.DEBUG === 'true' || process.env.DEBUG === '1';
const debugLog = (...args: any[]) => {
    if (isDebugMode()) {
        console.log(...args);
    }
};

/**
 * Helper to mark a penalty from the moderator page.
 */
async function markPenalty(moderatorPage: Page): Promise<void> {
    debugLog('Moderator marking penalty');
    const penaltyBtn = moderatorPage.getByRole('button', { name: /penalty/i });
    await expect(penaltyBtn).toBeEnabled({ timeout: 5000 });
    await penaltyBtn.click();
    debugLog('Penalty marked');
}

/**
 * Helper to verify moderator scoring button states.
 * @param moderatorPage - The moderator's page
 * @param expected - Object with expected enabled states for each button
 */
async function verifyModeratorButtons(
    moderatorPage: Page,
    expected: {
        correct: boolean;
        incorrect: boolean;
        penalty: boolean;
        markDead: boolean;
    }
): Promise<void> {
    const correctBtn = moderatorPage.getByRole('button', { name: /^correct$/i });
    const incorrectBtn = moderatorPage.getByRole('button', { name: /^incorrect$/i });
    const penaltyBtn = moderatorPage.getByRole('button', { name: /penalty/i });
    const markDeadBtn = moderatorPage.getByRole('button', { name: /mark dead/i });

    if (expected.correct) {
        await expect(correctBtn).toBeEnabled({ timeout: 5000 });
    } else {
        await expect(correctBtn).toBeDisabled({ timeout: 5000 });
    }

    if (expected.incorrect) {
        await expect(incorrectBtn).toBeEnabled({ timeout: 5000 });
    } else {
        await expect(incorrectBtn).toBeDisabled({ timeout: 5000 });
    }

    if (expected.penalty) {
        await expect(penaltyBtn).toBeEnabled({ timeout: 5000 });
    } else {
        await expect(penaltyBtn).toBeDisabled({ timeout: 5000 });
    }

    if (expected.markDead) {
        await expect(markDeadBtn).toBeEnabled({ timeout: 5000 });
    } else {
        await expect(markDeadBtn).toBeDisabled({ timeout: 5000 });
    }

    debugLog('Moderator buttons verified:', expected);
}

test.describe('Scoring Behaviors', () => {
    test('all scoring types with two players on different teams', async ({ browser }, testInfo) => {
        let moderatorContext: BrowserContext | undefined;
        let player1Context: BrowserContext | undefined;
        let player2Context: BrowserContext | undefined;

        try {
            // Create game with two default teams
            const { moderatorPage, moderatorContext: modCtx, joinCode } = await createGame(browser, {
                gameName: 'Scoring Test Game',
                ownerName: 'Moderator',
                defaultTeams: ['Team Alpha', 'Team Beta'],
            });
            moderatorContext = modCtx;

            // Player 1 joins Team Alpha
            const { playerPage: player1Page, playerContext: p1Ctx } = await joinGameAsPlayer(
                browser, joinCode, 'Player1', { teamName: 'Team Alpha' }
            );
            player1Context = p1Ctx;

            // Player 2 joins Team Beta
            const { playerPage: player2Page, playerContext: p2Ctx } = await joinGameAsPlayer(
                browser, joinCode, 'Player2', { teamName: 'Team Beta' }
            );
            player2Context = p2Ctx;

            debugLog('Both players joined on separate teams');

            // Wait for players to be fully connected
            await moderatorPage.waitForTimeout(500);

            // Initial state: No question open - all scoring buttons disabled
            await verifyModeratorButtons(moderatorPage, {
                correct: false,
                incorrect: false,
                penalty: false,
                markDead: false,
            });
            debugLog('Initial state - all moderator buttons disabled');

            // ===== TEST 1: Tossup Correct =====
            debugLog('\n=== TEST 1: Tossup Correct ===');
            await openQuestion(moderatorPage, { type: 'tossup', category: 'Biology', questionNumber: 1 });

            // After opening tossup: Mark Dead enabled, scoring buttons disabled (no buzz yet)
            await verifyModeratorButtons(moderatorPage, {
                correct: false,
                incorrect: false,
                penalty: false,
                markDead: true,
            });
            debugLog('Tossup open - Mark Dead enabled, scoring disabled');

            // Both players should have buzz enabled
            await player1Page.waitForTimeout(300);
            await expect(player1Page.locator('#buzz')).toBeEnabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeEnabled({ timeout: 5000 });
            debugLog('Both buzzes enabled for tossup');

            // Player 1 buzzes
            await buzz(player1Page);
            await moderatorPage.waitForTimeout(300);

            // After buzz: All scoring buttons enabled (except Mark Dead)
            await verifyModeratorButtons(moderatorPage, {
                correct: true,
                incorrect: true,
                penalty: true,
                markDead: false,
            });
            debugLog('After buzz - scoring buttons enabled, Mark Dead disabled');

            // After buzz: Player 1's buzz should be disabled, Player 2's should also be disabled (someone has buzzed)
            await expect(player1Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            debugLog('Both buzzes disabled after Player 1 buzzed');

            // Mark correct
            await markCorrect(moderatorPage);
            await player1Page.waitForTimeout(300);

            // After correct: All buttons disabled (idle state)
            await verifyModeratorButtons(moderatorPage, {
                correct: false,
                incorrect: false,
                penalty: false,
                markDead: false,
            });

            // After correct: Both buzzes should be disabled (question cleared)
            await expect(player1Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            debugLog('Tossup correct - question cleared, both buzzes disabled');

            // ===== TEST 2: Tossup Incorrect =====
            debugLog('\n=== TEST 2: Tossup Incorrect ===');
            await openQuestion(moderatorPage, { type: 'tossup', category: 'Chemistry', questionNumber: 2 });

            // After opening tossup: Mark Dead enabled
            await verifyModeratorButtons(moderatorPage, {
                correct: false,
                incorrect: false,
                penalty: false,
                markDead: true,
            });

            // Both players should have buzz enabled
            await player1Page.waitForTimeout(300);
            await expect(player1Page.locator('#buzz')).toBeEnabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeEnabled({ timeout: 5000 });

            // Player 2 buzzes
            await buzz(player2Page);
            await moderatorPage.waitForTimeout(300);

            // After buzz: Scoring enabled
            await verifyModeratorButtons(moderatorPage, {
                correct: true,
                incorrect: true,
                penalty: true,
                markDead: false,
            });

            // Both disabled after buzz
            await expect(player1Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });

            // Mark incorrect
            await markIncorrect(moderatorPage);
            await player1Page.waitForTimeout(300);

            // After incorrect: Question reopens, Mark Dead enabled again
            await verifyModeratorButtons(moderatorPage, {
                correct: false,
                incorrect: false,
                penalty: false,
                markDead: true,
            });

            // After incorrect on tossup: Player 1 (who didn't buzz) should be able to buzz
            // Player 2 (who already buzzed) should remain disabled
            await expect(player1Page.locator('#buzz')).toBeEnabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            debugLog('Tossup incorrect - Player 1 can rebuzz, Player 2 locked out');

            // Mark dead to clear the question
            await markDead(moderatorPage);
            await player1Page.waitForTimeout(300);

            // ===== TEST 3: Tossup Penalty =====
            debugLog('\n=== TEST 3: Tossup Penalty ===');
            await openQuestion(moderatorPage, { type: 'tossup', category: 'Physics', questionNumber: 3 });

            // After opening: Mark Dead enabled
            await verifyModeratorButtons(moderatorPage, {
                correct: false,
                incorrect: false,
                penalty: false,
                markDead: true,
            });

            // Both players should have buzz enabled
            await player1Page.waitForTimeout(300);
            await expect(player1Page.locator('#buzz')).toBeEnabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeEnabled({ timeout: 5000 });

            // Player 1 buzzes
            await buzz(player1Page);
            await moderatorPage.waitForTimeout(300);

            // After buzz: Scoring enabled
            await verifyModeratorButtons(moderatorPage, {
                correct: true,
                incorrect: true,
                penalty: true,
                markDead: false,
            });

            // Both disabled after buzz
            await expect(player1Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });

            // Mark penalty
            await markPenalty(moderatorPage);
            await player1Page.waitForTimeout(300);

            // After penalty: Question reopens, Mark Dead enabled
            await verifyModeratorButtons(moderatorPage, {
                correct: false,
                incorrect: false,
                penalty: false,
                markDead: true,
            });

            // After penalty: Player 2 can still buzz (question reopened for other team)
            // Player 1 (who got penalty) should be disabled
            await expect(player1Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeEnabled({ timeout: 5000 });
            debugLog('Tossup penalty - Player 2 can buzz, Player 1 locked out');

            // Mark dead to clear the question
            await markDead(moderatorPage);
            await player1Page.waitForTimeout(300);

            // ===== TEST 4: Tossup Mark Dead =====
            debugLog('\n=== TEST 4: Tossup Mark Dead ===');
            await openQuestion(moderatorPage, { type: 'tossup', category: 'Math', questionNumber: 4 });

            // After opening: Mark Dead enabled
            await verifyModeratorButtons(moderatorPage, {
                correct: false,
                incorrect: false,
                penalty: false,
                markDead: true,
            });

            // Both players should have buzz enabled
            await player1Page.waitForTimeout(300);
            await expect(player1Page.locator('#buzz')).toBeEnabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeEnabled({ timeout: 5000 });

            // Mark dead (before anyone buzzes)
            await markDead(moderatorPage);
            await player1Page.waitForTimeout(300);

            // After mark dead: All buttons disabled (idle state)
            await verifyModeratorButtons(moderatorPage, {
                correct: false,
                incorrect: false,
                penalty: false,
                markDead: false,
            });

            // After mark dead: Both buzzes should be disabled (question cleared)
            await expect(player1Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            debugLog('Tossup mark dead - both buzzes disabled');

            // ===== TEST 5: Bonus Correct =====
            debugLog('\n=== TEST 5: Bonus Correct ===');
            await openQuestion(moderatorPage, { type: 'bonus', category: 'Earth and Space', targetTeam: 'Team Alpha', questionNumber: 5 });

            // For bonus: Correct/Incorrect enabled immediately, Penalty and Mark Dead disabled
            await verifyModeratorButtons(moderatorPage, {
                correct: true,
                incorrect: true,
                penalty: false,
                markDead: false,
            });
            debugLog('Bonus open - Correct/Incorrect enabled, Penalty/Mark Dead disabled');

            // For bonus questions: Selected team (Team Alpha = Player1) can buzz, other team cannot
            await player1Page.waitForTimeout(300);
            await expect(player1Page.locator('#buzz')).toBeEnabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            debugLog('Bonus question - Player1 (Team Alpha) can buzz, Player2 (Team Beta) disabled');

            // Mark correct
            await markCorrect(moderatorPage);
            await player1Page.waitForTimeout(300);

            // After bonus correct: All buttons disabled (idle state)
            await verifyModeratorButtons(moderatorPage, {
                correct: false,
                incorrect: false,
                penalty: false,
                markDead: false,
            });

            // After bonus correct: Both buzzes disabled (question cleared)
            await expect(player1Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            debugLog('Bonus correct - question cleared');

            // ===== TEST 6: Bonus Incorrect =====
            debugLog('\n=== TEST 6: Bonus Incorrect ===');
            await openQuestion(moderatorPage, { type: 'bonus', category: 'Energy', targetTeam: 'Team Beta', questionNumber: 6 });

            // For bonus: Correct/Incorrect enabled immediately, Penalty and Mark Dead disabled
            await verifyModeratorButtons(moderatorPage, {
                correct: true,
                incorrect: true,
                penalty: false,
                markDead: false,
            });

            // For bonus questions: Selected team (Team Beta = Player2) can buzz, other team cannot
            await player1Page.waitForTimeout(300);
            await expect(player1Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeEnabled({ timeout: 5000 });
            debugLog('Bonus question - Player2 (Team Beta) can buzz, Player1 (Team Alpha) disabled');

            // Mark incorrect
            await markIncorrect(moderatorPage);
            await player1Page.waitForTimeout(300);

            // After bonus incorrect: All buttons disabled (idle state)
            await verifyModeratorButtons(moderatorPage, {
                correct: false,
                incorrect: false,
                penalty: false,
                markDead: false,
            });

            // After bonus incorrect: Both buzzes disabled (question cleared)
            await expect(player1Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            await expect(player2Page.locator('#buzz')).toBeDisabled({ timeout: 5000 });
            debugLog('Bonus incorrect - question cleared');

            debugLog('\n=== All 6 scoring tests passed! ===');

        } finally {
            if (player2Context) await player2Context.close();
            if (player1Context) await player1Context.close();
            if (moderatorContext) await moderatorContext.close();
        }
    });
});
