import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
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
    // The target's helm holds its first two cards, with two more to draw. Its engineer holds one.
    targetSetup.helm = { ...targetSetup.helm, cards: ['exampleNoTarget', 'slowAndSteady', 'zigZag', 'strafe'], initialHandSize: 2 };
    targetSetup.engineer = { ...targetSetup.engineer, cards: ['exampleNoTarget', 'exampleNoTarget'], initialHandSize: 1 };
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

describe('ScienceState reading a hand', () => {
    function scan(scanner: AiShip, target: AiShip, scannedSystemIndex: number) {
        const card = scanner.scienceState.hand[0];
        return scanner.scienceState.playCard(card.id, card.type, 'scan', `target/${target.id}/${scannedSystemIndex}`);
    }

    function readHand(scanner: AiShip, target: AiShip, system: CrewRoleName) {
        const card = scanner.scienceState.hand[0];
        return scanner.scienceState.playCard(card.id, card.type, 'scan', `hand/${target.id}/${system}`);
    }

    function cardTypes(cards: Iterable<CardState> | null | undefined) {
        return cards ? [...cards].map(card => card.type) : null;
    }

    it('doesn\'t show a scanned system\'s hand until it\'s read', () => {
        const { scanner, target } = createWorld();

        scan(scanner, target, target.helmState.scannedSystemIndex);

        expect(scanner.scienceState.scannedHelm!.hand).toBeNull();
    });

    it('shows the cards in a scanned system\'s hand once it\'s read, using up the scan card', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.helmState.scannedSystemIndex);
        const card = scanner.scienceState.hand[0];

        const played = readHand(scanner, target, 'helm');

        expect(played).not.toBeNull();
        expect(cardTypes(scanner.scienceState.scannedHelm!.hand)).toEqual(['exampleNoTarget', 'slowAndSteady']);
        expect(scanner.scienceState.hand).not.toContain(card);
        expect(scanner.scienceState.deck).toContain(card);
    });

    it('shows the hand as read but empty when the system holds no cards', () => {
        const { scanner, target } = createWorld();
        target.helmState.discard(2);
        scan(scanner, target, target.helmState.scannedSystemIndex);

        readHand(scanner, target, 'helm');

        expect(scanner.scienceState.scannedHelm!.hand).not.toBeNull();
        expect(scanner.scienceState.scannedHelm!.hand).toHaveLength(0);
    });

    it('shows copies of the cards, with their traits', () => {
        const { scanner, target } = createWorld();
        target.helmState.adjustHealth(-target.helmState.maxHealth);
        scan(scanner, target, target.helmState.scannedSystemIndex);

        readHand(scanner, target, 'helm');

        const shown = scanner.scienceState.scannedHelm!.hand![0];
        expect(shown).not.toBe(target.helmState.hand[0]);
        expect(shown.id).toBe(target.helmState.hand[0].id);
        expect(shown.isDamaged).toBe(true);
    });

    it('keeps the hand up to date as the target draws and plays cards', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.helmState.scannedSystemIndex);
        readHand(scanner, target, 'helm');
        const shown = scanner.scienceState.scannedHelm!;

        target.helmState.drawFromTop();
        expect(cardTypes(shown.hand)).toEqual(['exampleNoTarget', 'slowAndSteady', 'zigZag']);

        target.helmState.adjustPowerLevel(5);
        const played = target.helmState.playCard(target.helmState.hand[0].id, 'exampleNoTarget', 'no-target', '');
        expect(played).not.toBeNull();
        expect(cardTypes(shown.hand)).toEqual(['slowAndSteady', 'zigZag']);

        target.helmState.discard(2);
        expect(shown.hand).toHaveLength(0);
    });

    it('shows when cards in the hand are damaged', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.helmState.scannedSystemIndex);
        readHand(scanner, target, 'helm');

        target.helmState.adjustHealth(-target.helmState.maxHealth);

        expect([...scanner.scienceState.scannedHelm!.hand!].every(card => card.isDamaged)).toBe(true);
    });

    it('keeps an engineer\'s hand up to date', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.engineerState.scannedSystemIndex);
        readHand(scanner, target, 'engineer');
        expect(scanner.scienceState.scannedEngineer!.hand).toHaveLength(1);

        target.engineerState.drawFromTop();

        expect(scanner.scienceState.scannedEngineer!.hand).toHaveLength(2);
    });

    it('stops showing the hand when science scans another system, and has to read it again on coming back', () => {
        const { scanner, target } = createWorld();
        scanner.scienceState.drawFromTop(2);
        scan(scanner, target, target.helmState.scannedSystemIndex);
        readHand(scanner, target, 'helm');

        scan(scanner, target, target.tacticalState.scannedSystemIndex);
        expect(scanner.scienceState.scannedHelm).toBeNull();
        expect(scanner.scienceState.scannedTactical!.hand).toBeNull();

        scan(scanner, target, target.helmState.scannedSystemIndex);
        expect(scanner.scienceState.scannedHelm!.hand).toBeNull();
    });

    it('stops showing the hand when science scans another ship', () => {
        const { state, scanner, target } = createWorld();
        const other = new AiShip(state, { ...shipSetup('player', 0, 5), goal: { type: 'search-and-destroy' }, skill: 1 });
        state.add(other);
        scanner.updateKnownObjects(0);
        scanner.scienceState.drawFromTop();
        scan(scanner, target, target.helmState.scannedSystemIndex);
        readHand(scanner, target, 'helm');

        scan(scanner, other, other.helmState.scannedSystemIndex);

        expect(scanner.scienceState.scannedHelm!.targetId).toBe(other.id);
        expect(scanner.scienceState.scannedHelm!.hand).toBeNull();
        // Science no longer follows the first target's hand.
        target.helmState.drawFromTop();
        expect(scanner.scienceState.scannedHelm!.hand).toBeNull();
    });

    it('stops showing the hand when the scan is closed, or the target is lost', () => {
        const { scanner, target } = createWorld();
        scanner.scienceState.drawFromTop(2);
        scan(scanner, target, target.helmState.scannedSystemIndex);
        readHand(scanner, target, 'helm');

        scanner.scienceState.closeScan();
        expect(scanner.scienceState.scannedHelm).toBeNull();

        scan(scanner, target, target.helmState.scannedSystemIndex);
        expect(scanner.scienceState.scannedHelm!.hand).toBeNull();
        readHand(scanner, target, 'helm');
        scanner.scienceState.unsubscribeFromShip(target.id);
        expect(scanner.scienceState.scannedHelm).toBeNull();
    });

    it('can\'t read the hand of a system that isn\'t being scanned, leaving the card in hand', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.helmState.scannedSystemIndex);
        const card = scanner.scienceState.hand[0];

        expect(readHand(scanner, target, 'tactical')).toBeNull();

        expect(scanner.scienceState.hand).toContain(card);
        expect(scanner.scienceState.scannedTactical).toBeNull();
        expect(scanner.scienceState.scannedHelm!.hand).toBeNull();
    });

    it('can\'t read a hand before any of the ship\'s systems are scanned', () => {
        const { scanner, target } = createWorld();

        expect(readHand(scanner, target, 'helm')).toBeNull();
        expect(scanner.scienceState.hand).toHaveLength(2);
    });

    it('doesn\'t use up a second card reading a hand that\'s already read', () => {
        const { scanner, target } = createWorld();
        scanner.scienceState.drawFromTop();
        scan(scanner, target, target.helmState.scannedSystemIndex);
        readHand(scanner, target, 'helm');
        const card = scanner.scienceState.hand[0];

        expect(readHand(scanner, target, 'helm')).toBeNull();
        expect(scanner.scienceState.hand).toContain(card);
    });

    it('still finds a vulnerability on a scanned system, without reading its hand', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.helmState.scannedSystemIndex);
        const card = scanner.scienceState.hand[0];

        const played = scanner.scienceState.playCard(card.id, card.type, 'scan', `vuln/${target.id}/helm`);

        expect(played).not.toBeNull();
        expect(scanner.scienceState.identifiedVulnerability).not.toBeNull();
        expect(scanner.scienceState.scannedHelm!.hand).toBeNull();
    });

    it('has no side effect, whichever scan card reads the hand', () => {
        const { scanner, target } = createWorld();
        scan(scanner, target, target.helmState.scannedSystemIndex);
        // An inverted chroniton scan draws science's whole hand from the bottom of the deck when it finds a vulnerability.
        const card = new CardState(997, 'invertedChronitonScan');
        scanner.scienceState.addCardToHand(card);
        const handBefore = scanner.scienceState.hand.length;

        scanner.scienceState.playCard(card.id, card.type, 'scan', `hand/${target.id}/helm`);

        expect(scanner.scienceState.scannedHelm!.hand).not.toBeNull();
        expect(scanner.scienceState.hand).toHaveLength(handBefore - 1);
        expect(scanner.scienceState.identifiedVulnerability).toBeNull();
    });
});
