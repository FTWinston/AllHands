/// <reference types="vite/client" />
import { engineContent } from 'content/content.engine';
import { sharedContent } from 'content/content.shared';
import { describe, expect, it } from 'vitest';

type Modules = Record<string, Record<string, unknown>>;

/** Every piece of content of the given side that the given modules export, by the file and name it's exported as. */
function exportedContent(modules: Modules, side: string) {
    return Object.entries(modules).flatMap(([file, exports]) => Object.entries(exports)
        .filter(([, value]) => (value as { side?: string } | null)?.side === side)
        .map(([name, value]) => ({ name: `${name} (${file})`, value })));
}

/** The cards and effects that a folder's `cards/` and `effects/` files export, which its content puts together. */
function exportedPieces(modules: Modules) {
    return Object.entries(modules)
        .filter(([file]) => /\/(cards|effects)\/[^/]+$/.test(file))
        .flatMap(([file, exports]) => (['cards', 'effects'] as const)
            .filter(kind => kind in exports)
            .map(kind => ({ name: `${kind} (${file})`, kind, value: exports[kind] })));
}

// Every content file, whether or not anything imports it.
const sharedModules: Modules = import.meta.glob('/content/**/*.shared.ts', { eager: true });
const engineModules: Modules = import.meta.glob('/content/**/*.engine.ts', { eager: true });

describe('content registration', () => {
    it.each(exportedContent(sharedModules, 'shared'))('lists $name in content.shared.ts', ({ value }) => {
        expect(sharedContent).toContain(value);
    });

    it.each(exportedContent(engineModules, 'engine'))('lists $name in content.engine.ts', ({ value }) => {
        expect(engineContent).toContain(value);
    });

    it.each(exportedPieces(sharedModules))('puts $name into content listed in content.shared.ts', ({ kind, value }) => {
        expect(sharedContent.some(content => content[kind] === value)).toBe(true);
    });

    it.each(exportedPieces(engineModules))('puts $name into content listed in content.engine.ts', ({ kind, value }) => {
        expect(engineContent.some(content => content[kind] === value)).toBe(true);
    });

    it('gives each piece of shared content its behaviour in the engine, once', () => {
        for (const shared of sharedContent) {
            expect(engineContent.filter(content => content.shared === shared)).toHaveLength(1);
        }
    });

    it('lists each piece of content once', () => {
        expect(new Set(sharedContent).size).toBe(sharedContent.length);
        expect(new Set(engineContent).size).toBe(engineContent.length);
    });
});
