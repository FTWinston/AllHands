import { chromium, Browser, BrowserContext, Page } from 'playwright';

// First, launch the browser
const browser: Browser = await chromium.launch({
    headless: false, // Must be false to visually see the game
    args: ['--disable-infobars']
});

const GAME_URL = 'http://localhost:23552/';
const TOTAL_PLAYERS = 4;

// Screen dimensions for 2x2 tiling (assuming 1920x1080 screen)
const width = 900;
const height = 500;

const xOffset = -1920; // Set to 0 for main screen, the width of your screen to move to a monitor on the right, or -the width of a screen to the left to move onto that instead.

console.log(`Launching ${TOTAL_PLAYERS} players...`);

for (let i = 0; i < TOTAL_PLAYERS; i++) {
    console.log(`Creating window for player ${i + 1}...`);

    // Create browser windows for each player, positioning in a 2x2 grid.
    const x = (i % 2) * width + xOffset;
    const y = Math.floor(i / 2) * height;

    const context: BrowserContext = await browser.newContext({
        viewport: { width, height },
        screen: { width: 1920, height: 1080 }
    });

    const page: Page = await context.newPage();
    
    // Position the window (requires using CDPSession for window bounds)
    // This connects directly to the browser protocol to move the window.
    const session = await context.newCDPSession(page);
    await session.send('Browser.setWindowBounds', {
      windowId: (await session.send('Browser.getWindowForTarget')).windowId,
      bounds: { left: x, top: y, width, height }
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

    console.log(`Setting up player ${i + 1}...`);
    
    try {
        await page.goto(GAME_URL, { waitUntil: 'load' });

        // Wait for buttons to load to ensure DOM is ready
        // Using a generic 'button' selector, but waiting for at least 4 to exist
        await page.waitForFunction(() => document.querySelectorAll('button').length >= 4);

        // Click the specific role button (1st, 2nd, 3rd, 4th)
        // .nth(i) is 0-indexed, so it clicks the 1st button for player 0, etc.
        await page.locator('button').nth(i).click();
        
        // Click the last button (The "Ready" button)
        await page.locator('button').last().click();

        console.log(`✅ Player ${i + 1} ready!`);
    } catch (error) {
        console.error(`❌ Error setting up player ${i + 1}:`, error);
    }
}

console.log('--- All players initialized. ---');
