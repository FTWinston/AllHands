import { shipSystems, type ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getCardDefinition } from 'engine/cards/getEngineCardDefinition';
import { AiShip } from 'engine/state/AiShip';
import { CardState } from 'engine/state/CardState';
import { setupGameRoom, shipSetup } from 'engine/testUtils';
import { describe, expect, it, vi } from 'vitest';
import { applyDeflector } from './applyDeflector.engine';
import { deflectorBurstRadius, mapDeflectorCards, type DeflectorParts } from './deflectorParts.shared';
import { deflectorsShared } from './deflectors.shared';
import type { CardType, UntargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import type { HullSystemTile } from 'engine/state/systems/engineer/HullSystemTile';

const rooms = setupGameRoom();

function createWorld() {
    const state = rooms.createState();
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');

    const createShip = (faction: string, x: number, y: number, hullCards?: UntargetedCardType[]) => {
        const setup = { ...shipSetup(faction, x, y), goal: { type: 'search-and-destroy' as const }, skill: 1 };
        setup.science = { ...setup.science, cards: ['passiveScan', 'passiveScan'], initialHandSize: 0 };
        setup.helm = { ...setup.helm, cards: ['slowAndSteady', 'zigZag', 'strafe', 'fullReverse'], initialHandSize: 0 };
        if (hullCards) {
            setup.hull = { ...setup.hull, cards: hullCards };
        }
        const ship = new AiShip(state, setup);
        state.add(ship);
        return ship;
    };

    const ship = createShip('player', 0, 0);
    const target = createShip('raiders', 5, 0, ['hullShieldEmitter', 'hullShieldEmitter']);
    const nearbyHostile = createShip('raiders', 0, deflectorBurstRadius - 1);
    const farHostile = createShip('raiders', deflectorBurstRadius * 4, 0);
    const ally = createShip('player', 0, -(deflectorBurstRadius - 1));
    const farAlly = createShip('player', -deflectorBurstRadius * 4, 0);

    ship.updateKnownObjects(0);
    const science = ship.scienceState;
    science.adjustPowerLevel(5);

    /** Fills or empties a ship's shields: 1 is full. */
    const setShields = (on: AiShip, fraction: number) => {
        const tile = on.engineerState.systems.find(candidate => candidate.system === 'hull') as HullSystemTile;
        tile.setShield(Math.round(on.hullState.maxShield * fraction));
    };
    setShields(target, 0);

    /** Fires a deflector loaded with the given parts from the ship at the target. */
    const fire = (modifier: DeflectorParts['modifier'], substance: DeflectorParts['substance'], delivery: DeflectorParts['delivery'], at = target) =>
        applyDeflector(state, ship, at, { modifier, substance, delivery });

    /** Plays a scan card of the given type to reveal one of the target's systems, which science goes on scanning. */
    const reveal = (system: CrewRoleName) => {
        const card = new CardState(ship.getCardId(), 'passiveScan');
        science.addCardToHand(card);
        expect(science.playCard(card.id, 'passiveScan', 'scan', `target/${target.id}/${target.getCrewSystem(system).scannedSystemIndex}`)).not.toBeNull();
    };

    const tile = (on: AiShip, system: ShipSystem) => on.engineerState.systems.find(candidate => candidate.system === system)!;
    const effect = (on: AiShip, system: ShipSystem, type: SystemEffectType) => tile(on, system).effects.find(candidate => candidate.type === type);
    const level = (on: AiShip, system: ShipSystem, type: SystemEffectType) => effect(on, system, type)?.level ?? 0;
    const timeLeft = (on: AiShip, system: ShipSystem, type: SystemEffectType) => effect(on, system, type)!.progress!.endTime - state.currentTime;
    /** The systems of a ship that have the given effect. */
    const systemsWith = (on: AiShip, type: SystemEffectType) => shipSystems.filter(system => effect(on, system, type));

    return { state, ship, target, nearbyHostile, farHostile, ally, farAlly, science, setShields, fire, reveal, tile, effect, level, timeLeft, systemsWith };
}

describe('deflector substances', () => {
    it('Antiproton raises the damage a system takes', () => {
        const { target, fire, reveal, level } = createWorld();
        reveal('tactical');
        fire('Modulated', 'Antiproton', 'Beam');

        expect(level(target, 'tactical', 'antiprotonResidue')).toBe(40);

        const adjustHealth = vi.spyOn(target.tacticalState, 'adjustHealth');
        target.tacticalState.applyDamage.invoke(5);
        expect(adjustHealth).toHaveBeenCalledWith(-7);
    });

    it('Tetryon makes a system easier to hit', () => {
        const { target, fire, reveal, level } = createWorld();
        reveal('helm');
        fire('Modulated', 'Tetryon', 'Beam');

        expect(level(target, 'helm', 'tetryonSaturation')).toBe(30);
        expect(target.helmState.chanceToHitPercentageModifier).toBe(30);
    });

    it('Chroniton makes a system fail every other card draw, for longer as it has no levels', () => {
        const { target, fire, reveal, timeLeft } = createWorld();
        reveal('science');
        fire('Modulated', 'Chroniton', 'Beam');

        expect(timeLeft(target, 'science', 'chronitonSaturation')).toBe(30_000);
        expect(target.scienceState.scheduledDraw.invoke()).toBe(false);
    });

    it('Polaron takes power from a system', () => {
        const { target, fire, reveal, level } = createWorld();
        const power = target.engineerState.powerLevel;
        reveal('engineer');
        fire('Modulated', 'Polaron', 'Beam');

        expect(level(target, 'engineer', 'polaronBombardment')).toBe(2);
        expect(target.engineerState.powerLevel).toBe(power - 2);
    });

    it('Graviton slows the whole ship\'s manoeuvres, from its helm, whichever system is hit', () => {
        const { target, fire, reveal, level, systemsWith } = createWorld();
        reveal('tactical');
        fire('Modulated', 'Graviton', 'Beam');

        expect(systemsWith(target, 'gravitonDrag')).toEqual(['helm']);
        expect(level(target, 'helm', 'gravitonDrag')).toBe(40);
        expect(target.helmState.maneuverSpeedModifier).toBe(-40);
    });
});

describe('deflector deliveries', () => {
    it('Beam hits the system being scanned on the target, strongly', () => {
        const { target, fire, reveal, systemsWith, level } = createWorld();
        reveal('science');
        fire('Modulated', 'Antiproton', 'Beam');

        expect(systemsWith(target, 'antiprotonResidue')).toEqual(['science']);
        expect(level(target, 'science', 'antiprotonResidue')).toBe(40);
    });

    it('Beam hits one random crew system, if science isn\'t scanning the target', () => {
        const { target, fire, systemsWith } = createWorld();
        fire('Modulated', 'Antiproton', 'Beam');

        const hit = systemsWith(target, 'antiprotonResidue');
        expect(hit).toHaveLength(1);
        expect(['helm', 'tactical', 'science', 'engineer']).toContain(hit[0]);
    });

    it('Pulse hits every system of the target, weakly', () => {
        const { target, nearbyHostile, fire, systemsWith, level } = createWorld();
        fire('Modulated', 'Antiproton', 'Pulse');

        expect(systemsWith(target, 'antiprotonResidue')).toEqual([...shipSystems]);
        expect(level(target, 'hull', 'antiprotonResidue')).toBe(20);
        expect(systemsWith(nearbyHostile, 'antiprotonResidue')).toEqual([]);
    });

    it('Burst hits every system of each hostile ship near the ship firing it, and nothing else', () => {
        const { ship, target, nearbyHostile, farHostile, ally, fire, systemsWith, level } = createWorld();
        fire('Modulated', 'Antiproton', 'Burst');

        expect(systemsWith(target, 'antiprotonResidue')).toEqual([...shipSystems]);
        expect(systemsWith(nearbyHostile, 'antiprotonResidue')).toEqual([...shipSystems]);
        expect(level(nearbyHostile, 'helm', 'antiprotonResidue')).toBe(10);
        expect(systemsWith(farHostile, 'antiprotonResidue')).toEqual([]);
        expect(systemsWith(ally, 'antiprotonResidue')).toEqual([]);
        expect(systemsWith(ship, 'antiprotonResidue')).toEqual([]);
    });

    it('Burst still fires when it hits nothing, such as at a target out of its reach', () => {
        const { farHostile, fire, systemsWith } = createWorld();

        expect(fire('Modulated', 'Antiproton', 'Burst', farHostile)).toBe(true);
        expect(systemsWith(farHostile, 'antiprotonResidue')).toEqual([]);
    });

    it('Field hits every system of the target weakly, but lingers', () => {
        const { target, fire, systemsWith, level, timeLeft } = createWorld();
        fire('Modulated', 'Antiproton', 'Field');

        expect(systemsWith(target, 'antiprotonResidue')).toEqual([...shipSystems]);
        expect(level(target, 'reactor', 'antiprotonResidue')).toBe(10);
        expect(timeLeft(target, 'reactor', 'antiprotonResidue')).toBe(45_000);
    });

    it('lasts less time where the effect has no levels and the delivery is weaker', () => {
        const { target, fire, timeLeft } = createWorld();
        fire('Modulated', 'Chroniton', 'Pulse');

        expect(timeLeft(target, 'helm', 'chronitonSaturation')).toBe(15_000);
    });
});

describe('deflector modifiers', () => {
    it('Modulated is weakened by the target\'s shields, in proportion to how full they are', () => {
        const { target, fire, reveal, setShields, level } = createWorld();
        expect(target.hullState.maxShield).toBeGreaterThan(0);
        reveal('helm');

        setShields(target, 1);
        fire('Modulated', 'Antiproton', 'Beam');
        expect(level(target, 'helm', 'antiprotonResidue')).toBe(20);

        target.helmState.removeEffect('antiprotonResidue', 'early');
        setShields(target, 0.5);
        fire('Modulated', 'Antiproton', 'Beam');
        expect(level(target, 'helm', 'antiprotonResidue')).toBe(30);
    });

    it('Phased ignores the target\'s shields', () => {
        const { target, fire, reveal, setShields, level } = createWorld();
        reveal('helm');
        setShields(target, 1);
        fire('Phased', 'Antiproton', 'Beam');

        expect(level(target, 'helm', 'antiprotonResidue')).toBe(40);
    });

    it('Coherent lasts twice as long', () => {
        const { target, fire, reveal, timeLeft } = createWorld();
        reveal('helm');
        fire('Coherent', 'Antiproton', 'Beam');

        expect(timeLeft(target, 'helm', 'antiprotonResidue')).toBe(30_000);
    });

    it('Inverted leaves the opposite effect on your own ship, rather than on the target', () => {
        const { ship, target, fire, systemsWith, level } = createWorld();
        fire('Inverted', 'Antiproton', 'Pulse');

        expect(systemsWith(target, 'antiprotonResidue')).toEqual([]);
        expect(systemsWith(target, 'antiprotonShielding')).toEqual([]);
        expect(systemsWith(ship, 'antiprotonShielding')).toEqual([...shipSystems]);
        expect(level(ship, 'helm', 'antiprotonShielding')).toBe(20);
    });

    it('Inverted Burst helps every friendly ship nearby, yours included', () => {
        const { ship, target, ally, farAlly, nearbyHostile, fire, systemsWith } = createWorld();
        fire('Inverted', 'Graviton', 'Burst');

        expect(systemsWith(ship, 'gravitonLift')).toEqual(['helm']);
        expect(systemsWith(ally, 'gravitonLift')).toEqual(['helm']);
        expect(ally.helmState.maneuverSpeedModifier).toBe(10);
        expect(systemsWith(farAlly, 'gravitonLift')).toEqual([]);
        expect(systemsWith(target, 'gravitonLift')).toEqual([]);
        expect(systemsWith(nearbyHostile, 'gravitonDrag')).toEqual([]);
    });

    it('Inverted Beam hits the kind of system that science is scanning, on your own ship', () => {
        const { ship, fire, reveal, systemsWith } = createWorld();
        reveal('tactical');
        fire('Inverted', 'Polaron', 'Beam');

        expect(systemsWith(ship, 'polaronCharge')).toEqual(['tactical']);
    });

    it('Inverted isn\'t weakened by your own shields', () => {
        const { ship, fire, setShields, level } = createWorld();
        setShields(ship, 1);
        fire('Inverted', 'Tetryon', 'Pulse');

        expect(level(ship, 'helm', 'tetryonScattering')).toBe(15);
    });
});

describe('deflector effects on a system that already has them', () => {
    it('add to the level there, and last for the new duration', () => {
        const { state, target, fire, reveal, level, timeLeft } = createWorld();
        reveal('helm');
        fire('Modulated', 'Antiproton', 'Beam');
        state.currentTime += 5_000;
        fire('Modulated', 'Antiproton', 'Beam');

        expect(level(target, 'helm', 'antiprotonResidue')).toBe(80);
        expect(timeLeft(target, 'helm', 'antiprotonResidue')).toBe(15_000);
    });

    it('don\'t cut short an effect that was going to last longer', () => {
        const { target, fire, reveal, timeLeft } = createWorld();
        reveal('helm');
        fire('Modulated', 'Antiproton', 'Field');
        fire('Modulated', 'Antiproton', 'Beam');

        expect(timeLeft(target, 'helm', 'antiprotonResidue')).toBe(45_000);
    });
});

describe('the opposite effects that Inverted deflectors leave', () => {
    it('Antiproton Shielding cuts the damage a system takes', () => {
        const { ship } = createWorld();
        ship.helmState.adjustEffectLevel('antiprotonShielding', 50);
        const adjustHealth = vi.spyOn(ship.helmState, 'adjustHealth');
        ship.helmState.applyDamage.invoke(4);

        expect(adjustHealth).toHaveBeenCalledWith(-2);
    });

    it('Tetryon Scattering makes a system harder to hit, until it ends', () => {
        const { ship } = createWorld();
        ship.helmState.adjustEffectLevel('tetryonScattering', 20);
        expect(ship.helmState.chanceToHitPercentageModifier).toBe(-20);

        ship.helmState.removeEffect('tetryonScattering', 'expired');
        expect(ship.helmState.chanceToHitPercentageModifier).toBe(0);
    });

    it('Chroniton Acceleration makes every other scheduled draw bring an extra card', () => {
        const { ship } = createWorld();
        const helm = ship.helmState;
        helm.addEffect('chronitonAcceleration');

        helm.scheduledDraw.invoke();
        expect(helm.hand.length).toBe(2);
        helm.scheduledDraw.invoke();
        expect(helm.hand.length).toBe(3);
    });

    it('Polaron Charge adds power to a system, until it ends', () => {
        const { ship } = createWorld();
        const power = ship.tacticalState.powerLevel;
        ship.tacticalState.adjustEffectLevel('polaronCharge', 1);
        expect(ship.tacticalState.powerLevel).toBe(power + 1);

        ship.tacticalState.removeEffect('polaronCharge', 'expired');
        expect(ship.tacticalState.powerLevel).toBe(power);
    });

    it('Graviton Lift speeds up the ship\'s manoeuvres, until it ends', () => {
        const { ship } = createWorld();
        ship.helmState.adjustEffectLevel('gravitonLift', 30);
        expect(ship.helmState.maneuverSpeedModifier).toBe(30);

        ship.helmState.removeEffect('gravitonLift', 'expired');
        expect(ship.helmState.maneuverSpeedModifier).toBe(0);
    });
});

describe('deflector cards', () => {
    it('are one for each combination of parts', () => {
        expect(Object.keys(mapDeflectorCards(() => null)).sort()).toEqual(Object.keys(deflectorsShared.cards).sort());
    });

    it('each play by firing a deflector loaded with their parts', () => {
        const { state, ship, target, systemsWith } = createWorld();
        const definition = getCardDefinition('deflectorCoherentTetryonPulse');

        expect('play' in definition && definition.play(state, ship, target, null, { cost: 0 })).toBe(true);
        expect(systemsWith(target, 'tetryonSaturation')).toEqual([...shipSystems]);
    });
});

describe('playing the deflector', () => {
    /** Loads a scan card of the given type into one of the deflector's slots, and returns it. */
    function load(world: ReturnType<typeof createWorld>, type: CardType, slot: 'modifier' | 'substance' | 'delivery') {
        const card = new CardState(world.ship.getCardId(), type);
        world.science.addCardToHand(card);
        expect(world.science.playCard(card.id, type, 'scan', `deflector/${slot}`)).not.toBeNull();
        return card;
    }

    function playDeflector(world: ReturnType<typeof createWorld>) {
        const { science, target } = world;
        return science.playCard(science.deflectorCard.id, science.deflectorCard.type, 'enemy', target.id);
    }

    it('fires the combination its slots are loaded with, and expends the cards in them', () => {
        const world = createWorld();
        const { science, target, systemsWith, level, timeLeft } = world;
        world.reveal('tactical');

        const substance = load(world, 'antiprotonScan', 'substance');
        const modifierAndDelivery = load(world, 'coherentBeamScan', 'modifier');
        const delivery = load(world, 'coherentBeamScan', 'delivery');
        expect(science.deflectorCard.type).toBe('deflectorCoherentAntiprotonBeam');

        expect(playDeflector(world)).not.toBeNull();

        expect(systemsWith(target, 'antiprotonResidue')).toEqual(['tactical']);
        expect(level(target, 'tactical', 'antiprotonResidue')).toBe(40);
        expect(timeLeft(target, 'tactical', 'antiprotonResidue')).toBe(30_000);

        expect(science.modifierSlotCard).toBeNull();
        expect(science.substanceSlotCard).toBeNull();
        expect(science.deliverySlotCard).toBeNull();
        for (const card of [substance, modifierAndDelivery, delivery]) {
            expect(science.hand).not.toContain(card);
            expect(science.deck).toContain(card);
        }
        expect(science.deflectorCard.type).toBe('deflectorModulatedGravitonField');
    });

    it('fires an Inverted Pulse onto your own ship', () => {
        const world = createWorld();
        const { ship, target, systemsWith } = world;
        load(world, 'invertedChronitonScan', 'modifier');
        load(world, 'invertedPulseScan', 'delivery');
        load(world, 'chronitonScan', 'substance');

        expect(playDeflector(world)).not.toBeNull();

        expect(systemsWith(ship, 'chronitonAcceleration')).toEqual([...shipSystems]);
        expect(systemsWith(target, 'chronitonSaturation')).toEqual([]);
    });

    it('fires a Phased Burst at every hostile ship nearby, through their shields', () => {
        const world = createWorld();
        const { target, nearbyHostile, farHostile, setShields, systemsWith, level } = world;
        setShields(target, 1);
        load(world, 'phasedBurstScan', 'modifier');
        load(world, 'phasedBurstScan', 'delivery');
        load(world, 'polaronScan', 'substance');

        expect(playDeflector(world)).not.toBeNull();

        expect(level(target, 'helm', 'polaronBombardment')).toBe(1);
        expect(systemsWith(nearbyHostile, 'polaronBombardment')).toEqual([...shipSystems]);
        expect(systemsWith(farHostile, 'polaronBombardment')).toEqual([]);
    });

    it('fires the default combination, a Modulated Graviton Field, with nothing loaded', () => {
        const world = createWorld();
        const { target, level, timeLeft } = world;

        expect(playDeflector(world)).not.toBeNull();

        expect(level(target, 'helm', 'gravitonDrag')).toBe(10);
        expect(timeLeft(target, 'helm', 'gravitonDrag')).toBe(45_000);
    });
});
