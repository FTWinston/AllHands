import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { getCardDefinition } from 'src/cards/getEngineCardDefinition';
import { AiShip } from 'src/state/AiShip';
import { CardCooldownState } from 'src/state/CardCooldownState';
import { CardState } from 'src/state/CardState';
import { shipSetup, setupGameRoom } from 'src/testUtils';
import { describe, it, expect } from 'vitest';
import type { HullSystemTile } from '../engineer/HullSystemTile';

const rooms = setupGameRoom();

function hullTile(ship: AiShip) {
    return ship.engineerState.systems.find(tile => tile.system === 'hull') as HullSystemTile;
}

function createWorld() {
    const state = rooms.createState();
    state.initFactions([
        { id: 'player' },
        { id: 'raiders', relations: { player: RelationshipType.Hostile } },
    ], 'player');
    const setup = { ...shipSetup('raiders'), goal: { type: 'search-and-destroy' as const }, skill: 1 };
    setup.science = { ...setup.science, cards: ['passiveScan', 'passiveScan', 'invertedChronitonScan', 'coherentBeamScan'] as never, initialHandSize: 2 };
    const scanner = new AiShip(state, setup);
    state.add(scanner);
    const targetSetup = shipSetup('player', 5, 0);
    // Shield capacity comes only from hull cards: 5 emitters give 75.
    targetSetup.hull = { ...targetSetup.hull, cards: Array(5).fill('hullShieldEmitter') };
    const target = new AiShip(state, { ...targetSetup, goal: { type: 'search-and-destroy' }, skill: 1 });
    state.add(target);
    // AI ships start with full shields: empty them, so tests can set them.
    hullTile(target).setShield(0);
    scanner.updateKnownObjects(0);
    return { state, scanner, target };
}

describe('ScienceState scan-slot targeting', () => {
    it('draws from the bottom of the deck for vulnerability rewards', () => {
        const { scanner } = createWorld();
        const bottomCard = scanner.scienceState.deck.at(-1)!;

        scanner.scienceState.drawFromBottom();

        expect(scanner.scienceState.hand).toContain(bottomCard);
        expect(scanner.scienceState.deck).not.toContain(bottomCard);
    });

    it('plays a scan onto a specific scan slot of a target ship', () => {
        const { scanner, target } = createWorld();
        const card = scanner.scienceState.hand[0];

        const played = scanner.scienceState.playCard(card.id, 'passiveScan', 'scan', `target/${target.id}/0`);

        expect(played).not.toBeNull();
        expect(scanner.scienceState.scannedShipId).toBe(target.id);
        // Slot 0 now identifies whichever system the target randomised into it.
        const order = scanner.scienceState.systemOrderByTarget.get(target.id)!;
        expect(order.order[0]).toBeGreaterThan(0);
        // Tactical learned the identified system as a sub-target.
        expect(scanner.tacticalState.subTargetsByTarget.get(target.id)?.subTargets.length).toBe(1);
    });

    it('rejects an invalid slot index, leaving the card in hand', () => {
        const { scanner, target } = createWorld();
        const card = scanner.scienceState.hand[0];
        const handBefore = scanner.scienceState.hand.length;

        const played = scanner.scienceState.playCard(card.id, 'passiveScan', 'enemy', `target/${target.id}/9`);

        expect(played).toBeNull();
        expect(scanner.scienceState.hand.length).toBe(handBefore);
    });

    it('rejects a nonexistent target ship, leaving the card in hand', () => {
        const { scanner } = createWorld();
        const card = scanner.scienceState.hand[0];
        const handBefore = scanner.scienceState.hand.length;

        const played = scanner.scienceState.playCard(card.id, 'passiveScan', 'enemy', 'no-such-object:0');

        expect(played).toBeNull();
        expect(scanner.scienceState.hand.length).toBe(handBefore);
    });
});

describe('ScienceState scanned systems', () => {
    function scan(scanner: AiShip, target: AiShip, scannedSystemIndex: number) {
        const card = scanner.scienceState.hand[0];
        scanner.scienceState.playCard(card.id, card.type, 'scan', `target/${target.id}/${scannedSystemIndex}`);
    }

    it('keeps a scanned system\'s power up to date', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.tacticalState.scannedSystemIndex);
        const scanned = scanner.scienceState.scannedTactical!;
        const powerBefore = target.tacticalState.powerLevel;
        expect(scanned.power).toBe(powerBefore);

        target.tacticalState.adjustPowerLevel(-1);

        expect(scanned.power).toBe(powerBefore - 1);
    });

    it('shows which modifier card was played on a scanned weapon', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.tacticalState.scannedSystemIndex);
        const slot = target.tacticalState.slots[0];

        slot.card = new CardState(999, 'photonTorpedo');
        slot.modifierCard = 'lowYield';
        target.tacticalState.scienceScanDataChanged.invoke();

        expect(scanner.scienceState.scannedTactical!.weaponSlots[0].modifierCard).toBe('lowYield');
    });

    it('shows the scanned ship\'s hull health and shields, whichever system was scanned', () => {
        const { scanner, target } = createWorld();
        hullTile(target).setShield(40);

        scan(scanner, target, target.helmState.scannedSystemIndex);

        expect(scanner.scannedHull).toMatchObject({
            targetId: target.id,
            health: target.hullState.health,
            maxHealth: target.hullState.maxHealth,
            shield: 40,
            maxShield: target.hullState.maxShield,
        });
    });

    it('keeps the scanned hull\'s health and shields up to date', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.helmState.scannedSystemIndex);
        const healthBefore = target.hullState.health;

        hullTile(target).setShield(60);
        expect(scanner.scannedHull.shield).toBe(60);

        hullTile(target).setShield(35);
        expect(scanner.scannedHull.shield).toBe(35);

        hullTile(target).setShield(0);
        expect(scanner.scannedHull.shield).toBe(0);

        target.hullState.adjustHealth(-1);
        expect(scanner.scannedHull.health).toBe(healthBefore - 1);
    });

    it('shows the scanned ship\'s shield tuning', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.helmState.scannedSystemIndex);
        expect(scanner.scannedHull.shieldTuning).toBeNull();

        target.hullState.tuneShields('shieldTunedTorpedo');
        expect(scanner.scannedHull.shieldTuning).toBe('shieldTunedTorpedo');

        target.hullState.tuneShields('shieldReinforced');
        expect(scanner.scannedHull.shieldTuning).toBe('shieldReinforced');

        target.hullState.scrambleShields(2);
        expect(scanner.scannedHull.shieldTuning).toBeNull();
    });

    it('scrambles the target\'s shields when a tetryon scan finds a vulnerability', () => {
        const { state, scanner, target } = createWorld();
        hullTile(target).addEffect('shieldTunedEnergy');

        const card = getCardDefinition('tetryonScan');
        card.findVulnerability(state, scanner, target, 'helm', { cost: 2, scrambleCards: 3 });

        expect(hullTile(target).hasEffect('shieldTunedEnergy')).toBe(false);
        expect(hullTile(target).getEffectLevel('shieldScrambled')).toBe(3);
    });

    it('keeps showing the hull after the scan is closed, and while scanning the engineer', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.helmState.scannedSystemIndex);
        scanner.scienceState.closeScan();

        hullTile(target).setShield(50);
        expect(scanner.scannedHull.shield).toBe(50);

        // The engineer scan listens to the same hull tile, so mustn't replace the hull's listener.
        scan(scanner, target, target.engineerState.scannedSystemIndex);
        hullTile(target).setShield(60);
        expect(scanner.scannedHull.shield).toBe(60);
    });

    it('stops showing the hull when the scanned ship is lost', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.helmState.scannedSystemIndex);

        scanner.scienceState.unsubscribeFromShip(target.id);

        expect(scanner.scannedHull.targetId).toBe('');
        expect(hullTile(target).scienceScanDataChanged.hasListener(`${scanner.id}/hull`)).toBe(false);
    });

    it('shows how far through its maneuver a scanned helm is', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.helmState.scannedSystemIndex);
        expect(scanner.scienceState.scannedHelm!.maneuverProgress).toBeNull();

        target.helmState.setActiveManeuver(new CardCooldownState(new CardState(998, 'slowAndSteady'), 100, 600, 1));

        expect(scanner.scienceState.scannedHelm!.maneuverProgress).toMatchObject({ startTime: 100, endTime: 600 });
    });
});
