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

// Every content file, whether or not anything imports it.
const uiModules: Modules = import.meta.glob('/content/**/*.ui.{ts,tsx}', { eager: true });

describe('UI content registration', () => {
    it.each(exportedContent(uiModules, 'ui'))('lists $name in content.ui.ts', ({ value }) => {
        expect(uiContent).toContain(value);
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
