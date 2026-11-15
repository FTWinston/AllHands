/// <reference types="vite/client" />
import { sharedContent } from 'content/content.shared';
import { uiContent } from 'content/content.ui';
import { describe, expect, it } from 'vitest';

type Modules = Record<string, Record<string, unknown>>;

/** Every piece of content of the given side that the given modules export, by the file and name it's exported as. */
function exportedContent(modules: Modules, side: string) {
    return Object.entries(modules).flatMap(([file, exports]) => Object.entries(exports)
        .filter(([, value]) => (value as { side?: string } | null)?.side === side)
        .map(([name, value]) => ({ name: `${name} (${file})`, value })));
}

/** The pieces that a folder's `cards/`, `effects/` and `ships/` files (and `general/ships` and `general/appearances`) export, which its content puts together. */
function exportedPieces(modules: Modules) {
    return Object.entries(modules)
        .filter(([file]) => /\/(cards|effects|ships|appearances)\/[^/]+$/.test(file))
        .flatMap(([file, exports]) => (['cards', 'effects', 'drawings'] as const)
            .filter(kind => kind in exports)
            .map(kind => ({ name: `${kind} (${file})`, kind, value: exports[kind] })));
}

// Every content file, whether or not anything imports it.
const uiModules: Modules = import.meta.glob('/content/**/*.ui.{ts,tsx}', { eager: true });

describe('UI content registration', () => {
    it.each(exportedContent(uiModules, 'ui'))('lists $name in content.ui.ts', ({ value }) => {
        expect(uiContent).toContain(value);
    });

    it.each(exportedPieces(uiModules))('puts $name into content listed in content.ui.ts', ({ kind, value }) => {
        expect(uiContent.some(content => content[kind] === value)).toBe(true);
    });

    it('describes each piece of shared content in the clients, once', () => {
        for (const shared of sharedContent) {
            expect(uiContent.filter(content => content.shared === shared)).toHaveLength(1);
        }
    });

    it('lists each piece of content once', () => {
        expect(new Set(uiContent).size).toBe(uiContent.length);
    });
});
