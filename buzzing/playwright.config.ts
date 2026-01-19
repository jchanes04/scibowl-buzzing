import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for ESBOT Buzzing System E2E tests.
 * 
 * Two projects are defined:
 * - 'chromium' (default): Runs in headless mode, skips tests requiring headed mode
 * - 'chromium-headed': Runs with visible browser, includes all tests
 * 
 * @see https://playwright.dev/docs/test-configuration
 */

// Detect if running in headed mode via CLI flag
const isHeaded = process.argv.includes('--headed');

export default defineConfig({
    testDir: './tests',

    /* Run tests in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,

    /* Opt out of parallel tests on CI */
    workers: process.env.CI ? 1 : undefined,

    /* Reporter to use */
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list']
    ],

    /* Shared settings for all projects */
    use: {
        /* Base URL for the local dev server */
        baseURL: 'https://localhost:5173',

        /* Collect trace when retrying the failed test */
        trace: 'on-first-retry',

        /* Screenshot on failure */
        screenshot: 'only-on-failure',

        /* Video on failure */
        video: 'on-first-retry',

        /* Ignore HTTPS errors for local development */
        ignoreHTTPSErrors: true,

        /* Timeout for actions like click, fill, etc */
        actionTimeout: 15000,

        /* Viewport size */
        viewport: { width: 1280, height: 720 },
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                // Pass headed mode info to tests
                headless: !isHeaded,
            },
        },
    ],

    /* Global timeout for each test */
    timeout: 60000,

    /* Expect timeout */
    expect: {
        timeout: 15000,
    },
});
