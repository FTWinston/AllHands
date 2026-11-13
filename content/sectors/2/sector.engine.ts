import { bossDefinition } from 'content/general/encounters/BossEncounter.engine';
import { placeholderEncounters } from 'content/general/encounters/encounters.engine';
import { defineEngineContent } from 'engine/content/EngineContent';

// Defined apart from the content, as the escorts' designs are worked out from the content (see `ShipDesign`).
const bossB = bossDefinition('bossB', 'Placeholder Boss B', 'nebula', { bossName: 'Boss B', escorts: ['fighter', 'harrier'] });

// All content below is placeholder text, until the campaign is written.
export const sector2Engine = defineEngineContent({
    sectors: [{
        id: 'sector2',
        name: 'Placeholder Sector 2',
        introMessage: 'Placeholder intro message for sector 2.',
        outroMessage: 'Placeholder outro message for sector 2.',
        defeatMessage: 'Placeholder defeat message for sector 2.',
        environments: ['nebula', 'gasGiant', 'deepSpace'],
        encounters: placeholderEncounters,
        bossEncounterId: 'bossB',
    }],
    encounters: [bossB],
});

/** Everything sector 2 adds to the engine: the sector itself, and the encounters in it. */
export const sector2EngineContent = [
    sector2Engine,
] as const;
