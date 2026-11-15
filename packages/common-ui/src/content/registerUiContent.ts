import { registerCardDescriptions } from '../features/cards/utils/getUiCardDefinition';
import { registerEffectDescriptions } from '../utils/getUiSystemEffectDefinition';
import type { UiContent } from './UiContent';

const registered = new Set<UiContent>();

/**
 * Make a client aware of the given content: what its cards and status effects are called, and how they're described and drawn.
 * Each client's entry point does this with every piece of content (`content/content.ui.ts`) before it renders anything, as do Storybook and the test setup.
 * Registering the same content again does nothing.
 */
export function registerUiContent(contents: readonly UiContent[]) {
    for (const content of contents) {
        if (registered.has(content)) {
            continue;
        }
        registered.add(content);

        registerCardDescriptions(content.shared.cards, content.cards);
        registerEffectDescriptions(content.shared.effects, content.effects);
    }
}
