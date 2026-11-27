import fs from 'fs';
import path from 'path';
import { isCardRangePreset, isCardRangeStatus, type CardRangePreset, type CardRangeStatus } from 'common-data/features/cards/types/CardRangeInfo';

/** How trying out one card went, and the preset chosen for it, if it isn't the default. */
export interface CardRangeEntry {
    status?: CardRangeStatus;
    note?: string;
    preset?: CardRangePreset;
}

/** What's kept of the card range between games: the card last tried, and how each card went. */
export interface CardRangeProgress {
    current?: string;
    cards: Record<string, CardRangeEntry>;
}

/** Where the card range's progress is kept. */
export interface CardRangeStore {
    /** Where it is, to show in the dev tools. */
    readonly location: string;
    load(): CardRangeProgress;
    save(progress: CardRangeProgress): void;
}

/** Progress kept only for as long as the game runs, e.g. for tests. */
export function createMemoryStore(initial: CardRangeProgress = { cards: {} }): CardRangeStore & { progress: CardRangeProgress } {
    return {
        location: '(memory)',
        progress: structuredClone(initial),
        load() {
            return structuredClone(this.progress);
        },
        save(progress) {
            this.progress = structuredClone(progress);
        },
    };
}

/**
 * Progress kept in a JSON file, which can be committed or edited by hand.
 * A file that can't be read is left alone: progress is then only kept for as long as the game runs.
 */
export function createFileStore(filePath: string): CardRangeStore {
    let writable = true;

    return {
        location: filePath,
        load() {
            if (!fs.existsSync(filePath)) {
                return { cards: {} };
            }

            try {
                return parseProgress(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
            } catch (error) {
                writable = false;
                console.error(`[card range] Could not read ${filePath}, so progress won't be saved until it's fixed:`, error);
                return { cards: {} };
            }
        },
        save(progress) {
            if (!writable) {
                return;
            }

            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, `${JSON.stringify(progress, null, 2)}\n`);
        },
    };
}

/** Keeps only what's understood of a progress file, dropping anything else. */
function parseProgress(value: unknown): CardRangeProgress {
    const raw = (value ?? {}) as { current?: unknown; cards?: unknown };
    const progress: CardRangeProgress = { cards: {} };

    if (typeof raw.current === 'string') {
        progress.current = raw.current;
    }

    if (raw.cards && typeof raw.cards === 'object') {
        for (const [cardType, rawEntry] of Object.entries(raw.cards as Record<string, unknown>)) {
            const { status, note, preset } = (rawEntry ?? {}) as Record<string, unknown>;
            const entry: CardRangeEntry = {
                ...(isCardRangeStatus(status) && { status }),
                ...(typeof note === 'string' && note !== '' && { note }),
                ...(isCardRangePreset(preset) && { preset }),
            };

            if (Object.keys(entry).length > 0) {
                progress.cards[cardType] = entry;
            }
        }
    }

    return progress;
}

/**
 * Where the card range keeps its progress unless `CARD_RANGE_FILE` says otherwise: `docs/card-range.json` in the repository,
 * found by looking up from the working directory (which is game-app's when run with `npm run dev`).
 */
export function getDefaultProgressFile(): string {
    const fromEnvironment = process.env.CARD_RANGE_FILE;
    if (fromEnvironment) {
        return path.resolve(fromEnvironment);
    }

    let directory = process.cwd();
    for (;;) {
        if (fs.existsSync(path.join(directory, 'content')) && fs.existsSync(path.join(directory, 'packages'))) {
            return path.join(directory, 'docs', 'card-range.json');
        }

        const parent = path.dirname(directory);
        if (parent === directory) {
            return path.join(process.cwd(), 'card-range.json');
        }
        directory = parent;
    }
}
