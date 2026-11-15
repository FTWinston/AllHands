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

/** The pieces that a folder's `cards/`, `effects/` and `ships/` files (and `general/ships` and `general/appearances`) export, which its content puts together. */
function exportedPieces<TKind extends string>(modules: Modules, kinds: readonly TKind[]) {
    return Object.entries(modules)
        .filter(([file]) => /\/(cards|effects|ships|appearances)\/[^/]+$/.test(file))
        .flatMap(([file, exports]) => kinds
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

    it.each(exportedPieces(sharedModules, ['cards', 'effects', 'appearances'] as const))('puts $name into content listed in content.shared.ts', ({ kind, value }) => {
        expect(sharedContent.some(content => content[kind] === value)).toBe(true);
    });

    it.each(exportedPieces(engineModules, ['cards', 'effects', 'designs'] as const))('puts $name into content listed in content.engine.ts', ({ kind, value }) => {
        expect(engineContent.some(content => content[kind] === value)).toBe(true);
    });

    it('gives each piece of shared content its behaviour in the engine, once', () => {
        for (const shared of sharedContent) {
            const engine = engineContent.filter(content => content.shared === shared);
            // Shared content with only ship drawings (such as the unused ones in general/appearances) needs nothing from the engine.
            const needsBehaviour = Object.keys(shared.cards).length > 0 || Object.keys(shared.effects).length > 0;
            expect(engine.length).toBe(needsBehaviour ? 1 : engine.length && 1);
        }
    });

    it.each(engineContent.flatMap(content => Object.entries(content.designs).map(([design, definition]) => ({ design, definition, content }))))(
        'draws the $design design with a drawing in its own folder',
        ({ definition, content }) => {
            expect(Object.keys(content.shared?.appearances ?? {})).toContain(definition.appearance);
        }
    );

    it.each(engineContent.flatMap(content => Object.keys(content.shared?.appearances ?? {}).map(appearance => ({ appearance, content }))))(
        'uses the $appearance drawing for one of the designs beside it',
        ({ appearance, content }) => {
            // Drawings that no design uses yet go in content/general/appearances, which has no engine content.
            expect(Object.values(content.designs).map(design => design.appearance)).toContain(appearance);
        }
    );

    it('lists each piece of content once', () => {
        expect(new Set(sharedContent).size).toBe(sharedContent.length);
        expect(new Set(engineContent).size).toBe(engineContent.length);
    });
});
