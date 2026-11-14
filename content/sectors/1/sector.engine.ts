import { placeholderEncounters } from 'content/general/encounters/encounters.engine';
import { defineEngineContent } from 'engine/content/EngineContent';
import { deadWeightEngine } from './deadWeight/deadWeight.engine';
import { feverShipEngine } from './feverShip/feverShip.engine';
import { lastShuttleOutEngine } from './lastShuttleOut/lastShuttleOut.engine';
import { quarantineGateEngine } from './quarantineGate/quarantineGate.engine';
import { quietRunningEngine } from './quietRunning/quietRunning.engine';
import { slowBoatEngine } from './slowBoat/slowBoat.engine';
import { standingOrdersEngine } from './standingOrders/standingOrders.engine';
import { tollCollectorsEngine } from './tollCollectors/tollCollectors.engine';

// All content below is placeholder text, until the campaign is written.
export const sector1Engine = defineEngineContent({
    sectors: [{
        id: 'sector1',
        name: 'Placeholder Sector 1',
        introMessage: 'Placeholder intro message for sector 1.',
        outroMessage: 'Placeholder outro message for sector 1.',
        defeatMessage: 'Placeholder defeat message for sector 1.',
        environments: ['asteroidField', 'deepSpace', 'nebula'],
        encounters: {
            early: [...placeholderEncounters.early, 'tollCollectors'],
            late: [...placeholderEncounters.late, 'tollCollectors', 'slowBoat', 'standingOrders', 'feverShip', 'deadWeight', 'lastShuttleOut', 'quietRunning'],
        },
        bossEncounterId: 'quarantineGate',
    }],
});

/** Everything sector 1 adds to the engine: the sector itself, and the encounters in it. */
export const sector1EngineContent = [
    sector1Engine,
    tollCollectorsEngine,
    slowBoatEngine,
    standingOrdersEngine,
    feverShipEngine,
    deadWeightEngine,
    lastShuttleOutEngine,
    quietRunningEngine,
    quarantineGateEngine,
] as const;
