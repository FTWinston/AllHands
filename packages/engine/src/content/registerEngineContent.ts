import { registerSectors } from 'src/campaign/sectorThemes';
import { registerDesigns } from 'src/campaign/shipDesigns';
import { registerCards } from 'src/cards/getEngineCardDefinition';
import { registerEffects } from 'src/effects/getEngineSystemEffectDefinition';
import { registerEncounters } from 'src/encounters/EncounterRegistry';
import type { EngineContent } from './EngineContent';

const registered = new Set<EngineContent>();

/**
 * Make the engine aware of the given content: its cards, status effects, ship designs, encounters and sectors.
 * The engine's entry point does this with every piece of content (`content/content.engine.ts`), before a game starts, as does the test setup.
 * Registering the same content again does nothing.
 */
export function registerEngineContent(contents: readonly EngineContent[]) {
    for (const content of contents) {
        if (registered.has(content)) {
            continue;
        }
        registered.add(content);

        if (content.shared) {
            registerCards(content.shared.cards, content.cards);
            registerEffects(content.shared.effects, content.effects);
        }
        registerDesigns(content.designs);
        registerEncounters(content.encounters);
        registerSectors(content.sectors);
    }
}
