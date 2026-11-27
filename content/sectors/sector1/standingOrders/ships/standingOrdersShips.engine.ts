import { fighterTemplate } from 'content/general/general.engine';
import { system, reactorCards } from 'engine/campaign/shipDesigns';
import { defineDesigns } from 'engine/content/EngineContent';

/** The ship designs that only this encounter uses. */
export const designs = defineDesigns({
    // It stays where it was built: all its helm can do is turn to face things. Its shields (90) are fully powered, and there's a lot of bare hull under them,
    // so it can take a few hits after they've gone. It never leaves. Whoever spawns one decides what it's armed with.
    customsPlatform: {
        name: 'Customs Platform',
        ...fighterTemplate,
        appearance: 'diamond-monitor',
        hull: system([
            'hullShieldEmitter', 'hullShieldTuningEnergy', 'hullShieldTuningTorpedo', 'hullBare', 'hullShieldEmitter', 'hullBare', 'hullShieldEmitter', 'hullBare',
            'hullShieldEmitter', 'hullBare', 'hullShieldEmitter', 'hullBare', 'hullShieldEmitter', 'hullBare', ...Array<'hullBare'>(54).fill('hullBare'),
        ], 0),
        reactor: system(reactorCards(2, 'reactorPowerHull', 'reactorPowerHull', 'reactorPowerHull', 'reactorPowerTactical'), 0),
        helm: system(['pivot', 'pivot', 'pivot']),
        tactical: { ...system(['phaserCannon', 'photonTorpedo', 'phaserCannon', 'photonTorpedo']), numSlots: 2 },
        fleeThreshold: 0,
    },
});
