import { chromium, BrowserContext, Page } from 'playwright';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const GAME_URL = 'http://localhost:23552/';
const TOTAL_PLAYERS = 4;

// Portrait mobile aspect ratio (same viewport size as Pixel 8a).
// These will tile in a 4x1 row.
const width = 412 + 14; // Extra pixels to account for window borders.
const height = 945 + 7;

const xOffset = -1920; // Set to 0 for main screen, the width of your screen to move to a monitor on the right, or -the width of a screen to the left to move onto that instead.

console.log(`Launching ${TOTAL_PLAYERS} players...`);
const pages: Page[] = [];

// Create browser windows for each player, positioning in a row.
for (let i = 0; i < TOTAL_PLAYERS; i++) {
    console.log(`Creating window for player ${i + 1}...`);

    const x = i * width + xOffset;
    const y = 0;

    // Each player needs a unique user data directory for persistent context
    const userDataDir = mkdtempSync(join(tmpdir(), `player-${i}-`));

    // Launch using persistent context with app mode flags.
    // This properly respects Chrome args and removes browser chrome.
    const context: BrowserContext = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: null, // Dynamic viewport - resizes with window
        args: [
            `--app=${GAME_URL}`,           // App mode: no address bar or tabs
            '--disable-infobars',
            `--window-size=${width},${height}`,
            `--window-position=${x},${y}`,
        ]
    });

    // Get the page that was automatically created
    const page: Page = context.pages()[0] || await context.newPage();
    
    // Position the window using CDP to ensure correct placement
    const session = await context.newCDPSession(page);
    const { windowId } = await session.send('Browser.getWindowForTarget');
    await session.send('Browser.setWindowBounds', {
        windowId,
        bounds: { left: x, top: y, width, height, windowState: 'normal' }
    });

    await page.addInitScript(() => {
        // Overwrite the requestFullscreen function on every HTML element.
        HTMLElement.prototype.requestFullscreen = function() {
            console.log('Blocked programmatic fullscreen request.');
            // Return a resolved promise so the site thinks it succeeded 
            // and doesn't throw an error.
            return Promise.resolve();
        };

        // Also block the exit function to prevent errors.
        document.exitFullscreen = () => Promise.resolve();
    });

    pages.push(page);
}

for (let i = 0; i < TOTAL_PLAYERS; i++) {
    console.log(`Setting up player ${i + 1}...`);
    const page = pages[i];
    
    try {
        // Wait for the page to load.
        await page.waitForLoadState('load');

        // Wait for buttons to load to ensure DOM is ready
        // Using a generic 'button' selector, but waiting for at least 4 to exist.
        await page.waitForFunction(() => document.querySelectorAll('button').length >= 4);

        // Click the specific role button (1st, 2nd, 3rd, 4th)
        // .nth(i) is 0-indexed, so it clicks the 1st button for player 0, etc.
        await page.locator('button').nth(i).click();
        
        // Click the last button (the "Ready" button).
        await page.locator('button').last().click();

        console.log(`✅ Player ${i + 1} ready!`);
    } catch (error) {
        console.error(`❌ Error setting up player ${i + 1}:`, error);
    }
}

console.log('--- All players initialized. ---');
