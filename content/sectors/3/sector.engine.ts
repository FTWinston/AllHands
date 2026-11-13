import { bossDefinition } from 'content/general/encounters/BossEncounter.engine';
import { placeholderEncounters } from 'content/general/encounters/encounters.engine';
import { defineEngineContent } from 'engine/content/EngineContent';

// Defined apart from the content, as the escorts' designs are worked out from the content (see `ShipDesign`).
const bossC = bossDefinition('bossC', 'Placeholder Boss C', 'deepSpace', { bossName: 'Boss C', escorts: ['bulwark', 'fighter'] });

// All content below is placeholder text, until the campaign is written.
export const sector3Engine = defineEngineContent({
    sectors: [{
        id: 'sector3',
        name: 'Placeholder Sector 3',
        introMessage: 'Placeholder intro message for sector 3.',
        outroMessage: 'Placeholder outro message for sector 3.',
        defeatMessage: 'Placeholder defeat message for sector 3.',
        environments: ['deepSpace', 'gasGiant', 'asteroidField'],
        encounters: placeholderEncounters,
        bossEncounterId: 'bossC',
    }],
    encounters: [bossC],
});

/** Everything sector 3 adds to the engine: the sector itself, and the encounters in it. */
export const sector3EngineContent = [
    sector3Engine,
] as const;
