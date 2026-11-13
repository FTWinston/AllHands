// Launches the built app, starts a single-crew game, joins four crew pages, loads one encounter from the dev tools,
// and takes screenshots of the viewscreen and each crew member's screen as it plays. Nobody plays it: it shows what reaches each screen.
//
// Run from the repository root, after `npm run build:devtools`:
//   node .claude/skills/building-encounters/run-encounter.cjs "Dead Weight" [--elite] [--out <folder>] [--at 3,12,40]
//
// The first argument is the encounter's name as the dev tools list it. Screenshots and each screen's text go to the output folder
// (by default a `shots` folder beside wherever this is run from, so pass --out with a scratchpad path).
// It closes the app and the browser when it's done. If it's interrupted, kill the process tree: its pid is in <out>/pid.txt.
const { _electron, chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const net = require('net');

const args = process.argv.slice(2);
const option = (name, fallback) => {
    const index = args.indexOf(name);
    return index === -1 ? fallback : args[index + 1];
};

const encounterName = args[0];
if (!encounterName || encounterName.startsWith('--')) {
    console.error('Give the encounter\'s name as the dev tools list it, e.g. "Dead Weight".');
    process.exit(1);
}

const repo = process.cwd();
const elite = args.includes('--elite');
const out = path.resolve(option('--out', 'shots'));
const times = option('--at', '3,12,40').split(',').map(Number);
const tag = elite ? 'elite' : 'standard';
const gameUrl = 'http://localhost:23552/';
const port = 23552;

fs.mkdirSync(out, { recursive: true });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Nothing is served until Start is pressed in the app's own window.
async function waitForServer() {
    for (let attempt = 0; attempt < 120; attempt++) {
        const listening = await new Promise((resolve) => {
            const socket = net.connect(port, '127.0.0.1', () => {
                socket.end();
                resolve(true);
            });
            socket.on('error', () => resolve(false));
        });

        if (listening) {
            return;
        }

        await sleep(500);
    }

    throw new Error('The game server never started listening');
}

(async () => {
    const app = await _electron.launch({
        executablePath: path.join(repo, 'node_modules/electron/dist/electron.exe'),
        args: ['.'],
        cwd: path.join(repo, 'packages/game-app'),
    });
    fs.writeFileSync(path.join(out, 'pid.txt'), String(app.process().pid));

    const viewscreen = await app.firstWindow();
    await viewscreen.waitForLoadState('load');
    await viewscreen.getByText('Start single-crew game').click();
    await waitForServer();

    // Each crew page claims a role by dragging one of the four role cards up. They're in a fixed order, so page n takes the nth.
    const browser = await chromium.launch();
    const crew = [];
    for (let index = 0; index < 4; index++) {
        const page = await browser.newPage({ viewport: { width: 412, height: 915 }, hasTouch: false });
        await page.goto(gameUrl);

        const cards = page.locator('[aria-roledescription="draggable"]');
        await cards.nth(3).waitFor({ timeout: 30000 });

        const box = await cards.nth(index).boundingBox();
        const x = box.x + box.width * 0.25;
        const y = box.y + box.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x, 100, { steps: 20 });
        await page.mouse.up();

        crew.push(page);
    }

    // The game starts itself once every role is claimed.
    await sleep(8000);

    // The dev tools open on their ship tab.
    await viewscreen.getByRole('button', { name: 'Dev' }).click();
    await sleep(500);
    await viewscreen.getByText('Encounters', { exact: true }).click();
    await sleep(500);

    if (elite) {
        await viewscreen.getByTitle(`${encounterName}, elite form`).click();
    } else {
        await viewscreen.getByRole('button', { name: new RegExp(`^${encounterName}`) }).first().click();
    }

    await sleep(1000);
    await viewscreen.keyboard.press('Escape');

    let elapsed = 1;
    for (const at of times) {
        await sleep(Math.max(0, at - elapsed) * 1000);
        elapsed = at;

        await viewscreen.screenshot({ path: path.join(out, `${tag}-viewscreen-${at}s.png`) });
        for (let index = 0; index < crew.length; index++) {
            await crew[index].screenshot({ path: path.join(out, `${tag}-crew${index}-${at}s.png`) });
        }
    }

    const crewText = [];
    for (const page of crew) {
        crewText.push((await page.locator('body').innerText()).slice(0, 600).replace(/\n/g, ' | '));
    }
    fs.writeFileSync(path.join(out, `${tag}-crew-text.txt`), crewText.join('\n\n'));
    fs.writeFileSync(path.join(out, `${tag}-viewscreen-text.txt`), (await viewscreen.locator('body').innerText()).slice(0, 2000));

    await browser.close();
    await app.close();
    console.log(`Done. Screenshots are in ${out}`);
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
