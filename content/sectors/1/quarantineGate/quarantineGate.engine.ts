import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { fighterTemplate } from 'content/general/ships/ships.engine';
import { system, reactorCards } from 'engine/campaign/shipDesigns';
import { defineEngineContent } from 'engine/content/EngineContent';
import { quarantineGateShared } from './quarantineGate.shared';
import { quarantineGateDefinition } from './QuarantineGateEncounter.engine';
import type { GameState } from 'engine/state/GameState';
import type { Ship } from 'engine/state/Ship';

/** A Shutdown Key's play: the key is turned on its own station's system, for a while. Playing it again while it's turned starts its time over. */
function turnKey(role: CrewRoleName) {
    return (_gameState: GameState, ship: Ship) => {
        const tile = ship.engineerState.systems.find(candidate => candidate.system === role);
        return tile ? tile.addEffect('keyTurned') : false;
    };
}

export const quarantineGateEngine = defineEngineContent({
    shared: quarantineGateShared,
    encounters: [quarantineGateDefinition],
    cards: {
        shutdownKeyHelm: { play: turnKey('helm') },
        shutdownKeyScience: { play: turnKey('science') },
        shutdownKeyTactical: { play: turnKey('tactical') },
        shutdownKeyEngineer: { play: turnKey('engineer') },
        keyPower: {
            // Playing it again on a system that has it starts its time over, as adding an effect that's already there does.
            play: (_gameState, _ship, system) => system.addEffect('keyPower'),
        },
    },
    effects: {
        // Aux Power without its taking itself off every other system.
        keyPower: {
            apply: (system) => {
                system.adjustSystemPowerLevel(1);
                return true;
            },
            remove: (system) => {
                system.adjustSystemPowerLevel(-1);
            },
        },
        // Nothing to do here either: the quarantine gate decides what these are worth.
        gatePulse: {
            apply: () => true,
            remove: () => {},
        },
        keyTurned: {
            apply: () => true,
            remove: () => {},
        },
    },
    designs: {
        // One of the quarantine gate's pylons: a customs platform in another shape. It turns but never moves, and its shields (90) are fully powered,
        // over 60 bare hull, so hits that get through seldom cost it shield. It has no tuning cards, as the gate sets its tuning.
        // Torpedoes only, so it reaches as far as any crew weapon, and can't be shelled from outside its reach. With cannons as well, it spent
        // most of its time holding one it couldn't fire beyond 10. Its reactor feeds every other system as often as tactical, so it fires about every 45 seconds, and it starts with
        // nothing in hand, so a crew in reach has half a minute or more before the first. It never leaves.
        gatePylon: {
            name: 'Gate Pylon',
            ...fighterTemplate,
            appearance: 'outrigger-pod-cruiser',
            hull: system([...Array<'hullBare'>(60).fill('hullBare'), ...Array<'hullShieldEmitter'>(6).fill('hullShieldEmitter')], 0),
            reactor: system(reactorCards(
                2,
                'reactorPowerHull', 'reactorPowerHull', 'reactorPowerHull', 'reactorPowerTactical',
                'reactorPowerHelm', 'reactorPowerScience', 'reactorPowerEngineer', 'reactorPowerHelm', 'reactorPowerScience', 'reactorPowerEngineer'
            ), 0),
            helm: system(['faceTarget', 'faceTarget', 'faceTarget']),
            tactical: { ...system(['photonTorpedo', 'photonTorpedo'], 0), numSlots: 1 },
            fleeThreshold: 0,
        },
        // The relay keepers' boat: a clinic ship's hull, with fully powered shields (75) and almost nothing under them, and only Slow and Steady to fly with.
        // Nobody aboard shoots. It never runs.
        keeperBoat: {
            name: 'Keeper Boat',
            ...fighterTemplate,
            appearance: 'trimaran-cutter',
            hull: system(['hullBare', 'hullBare', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter', 'hullShieldEmitter'], 0),
            reactor: system(reactorCards(2, 'reactorPowerHull', 'reactorPowerHull', 'reactorPowerHull'), 0),
            helm: system(['slowAndSteady', 'slowAndSteady', 'slowAndSteady', 'slowAndSteady']),
            tactical: { ...system(['phaserStrip']), numSlots: 1 },
            fleeThreshold: 0,
            priorities: { tactical: 0 },
        },
    },
});
