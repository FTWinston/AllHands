import fs from 'fs';
import os from 'os';
import path from 'path';
import { cardRangeEncounterId } from 'common-data/features/cards/types/CardRangeInfo';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { AiShip } from 'src/state/AiShip';
import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { getHostileShips } from 'src/utils/shipQueries';
import { describe, expect, it } from 'vitest';
import { getCardRangeCardTypes, getCardRangeDefinition, getDefaultCardRangePreset } from './cardRangeCards';
import { CardRangeEncounter, respawnDelayMs } from './CardRangeEncounter';
import { createFileStore, createMemoryStore, type CardRangeProgress } from './cardRangeProgress';
import { CardRangeSession } from './CardRangeSession';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { GameState } from 'src/state/GameState';

const rooms = setupGameRoom();

function createSession(initial?: CardRangeProgress) {
    const state = rooms.createState(seededRandom(5));
    const { ships: [ship] } = startCampaign(state);
    state.campaign!.dismissMessage();
    const store = createMemoryStore(initial);
    const session = new CardRangeSession(state, store);
    return { state, ship, store, session };
}

function getEncounter(state: GameState) {
    const encounter = state.campaign!.activeEncounter;
    expect(encounter).toBeInstanceOf(CardRangeEncounter);
    return encounter as CardRangeEncounter;
}

function handCount(hand: Iterable<{ type: string }>, cardType: CardType) {
    return [...hand].filter(card => card.type === cardType).length;
}

/** Lets game time pass, as the campaign sees it. */
function passTime(state: GameState, durationMs: number, stepMs = 100) {
    for (let elapsed = 0; elapsed < durationMs; elapsed += stepMs) {
        state.currentTime += stepMs;
        state.campaign!.tick(stepMs);
    }
}

describe('Card range cards', () => {
    it('goes through every card system by system, leaving out choice cards\' options', () => {
        const cardTypes = getCardRangeCardTypes();
        const systems = cardTypes.map(cardType => getCardRangeDefinition(cardType).system);

        expect(systems[0]).toBe('helm');
        expect(systems.at(-1)).toBe('reactor');
        expect(new Set(cardTypes).size).toBe(cardTypes.length);
        expect(cardTypes).toContain('phaserCannon');
        expect(cardTypes).toContain('hullShieldEmitter');
        expect(cardTypes).not.toContain('sweepLeft');
    });

    it('sets up what each kind of card needs by default', () => {
        expect(getDefaultCardRangePreset('phaserCannon')).toBe('targets');
        expect(getDefaultCardRangePreset('flare')).toBe('incoming');

        const weaponCard = getCardRangeCardTypes().find(cardType => getCardRangeDefinition(cardType).targetType === 'weapon')!;
        expect(getDefaultCardRangePreset(weaponCard)).toBe('armed');
    });
});

describe('Card range', () => {
    it('loads the range with passive targets ahead, and deals the card to its crew member, with the power to play it', () => {
        const { state, ship, session } = createSession();

        expect(session.start('photonicCannon')).toBe(true);

        expect(state.encounter?.encounterId).toBe(cardRangeEncounterId);
        expect(getEncounter(state).currentCard).toBe('photonicCannon');

        const targets = getHostileShips(state);
        expect(targets.length).toBe(2);
        for (const target of targets) {
            expect(target.getPosition(state.currentTime).x).toBeGreaterThan(0);
        }

        const card = ship.tacticalState.hand.find(candidate => candidate.type === 'photonicCannon')!;
        expect(card).toBeDefined();
        expect(card.hasTrait('expendable')).toBe(true);
        expect(card.hasTrait('priority')).toBe(true);
        expect(ship.tacticalState.powerLevel).toBeGreaterThanOrEqual(Math.min(card.getParameter('cost'), ship.tacticalState.maxPowerLevel));
    });

    it('deals the card again on replay, without setting the range up afresh', () => {
        const { state, ship, session } = createSession();
        session.start('phaserCannon');
        const encounter = getEncounter(state);
        const before = handCount(ship.tacticalState.hand, 'phaserCannon');

        expect(session.handle({ action: 'replay' })).toBe(true);

        expect(getEncounter(state)).toBe(encounter);
        expect(handCount(ship.tacticalState.hand, 'phaserCannon')).toBe(before + 1);
    });

    it('sets the range up afresh on reset', () => {
        const { state, session } = createSession();
        session.start('phaserCannon');
        const encounter = getEncounter(state);

        expect(session.handle({ action: 'reset' })).toBe(true);

        expect(getEncounter(state)).not.toBe(encounter);
        expect(getHostileShips(state).length).toBe(2);
    });

    it('steps to the next and previous cards, wrapping around, and can skip those with a status', () => {
        const cardTypes = getCardRangeCardTypes();
        const { session } = createSession({ current: cardTypes[0], cards: { [cardTypes[1]]: { status: 'pass' } } });

        session.handle({ action: 'step', delta: -1 });
        expect(session.currentCard).toBe(cardTypes.at(-1));

        session.handle({ action: 'step', delta: 1 });
        session.handle({ action: 'step', delta: 1, untestedOnly: true });
        expect(session.currentCard).toBe(cardTypes[2]);
    });

    it('keeps how each card went, and picks up at the card last tried', () => {
        const { state, store, session } = createSession();
        session.start('flare');

        session.handle({ action: 'mark', status: 'fail', note: '  No flare drawn  ' });
        expect(store.progress).toEqual({ current: 'flare', cards: { flare: { status: 'fail', note: 'No flare drawn' } } });

        // A note left out is kept, and a null status clears it.
        session.handle({ action: 'mark', status: null });
        expect(store.progress.cards.flare).toEqual({ note: 'No flare drawn' });

        session.handle({ action: 'mark', status: null, note: '' });
        expect(store.progress.cards).toEqual({});

        const next = new CardRangeSession(state, store);
        expect(next.currentCard).toBe('flare');
    });

    it('keeps a preset chosen for a card, and sets the range up with it', () => {
        const { state, store, session } = createSession();
        session.start('phaserCannon');

        expect(session.handle({ action: 'preset', preset: 'ally' })).toBe(true);

        expect(store.progress.cards.phaserCannon).toEqual({ preset: 'ally' });
        expect(session.getInfo().cards.find(card => card.type === 'phaserCannon')?.preset).toBe('ally');

        const playerFaction = state.playerFaction!;
        const allies = [...state.objects.values()].filter(object => object instanceof AiShip
            && state.factionRegistry.getRelationshipBetween(playerFaction, object.faction) === RelationshipType.Friendly);
        expect(allies.length).toBe(1);

        // Choosing the default again forgets the choice.
        session.handle({ action: 'preset', preset: 'targets' });
        expect(store.progress.cards.phaserCannon).toBeUndefined();
    });

    it('loads a weapon for cards played on one, and damages the crew systems when asked', () => {
        const { ship, session } = createSession();
        const weaponCard = getCardRangeCardTypes().find(cardType => getCardRangeDefinition(cardType).targetType === 'weapon')!;

        session.start(weaponCard);
        expect(ship.tacticalState.slots[0].card).not.toBeNull();

        const fullHealth = ship.helmState.health;
        session.handle({ action: 'preset', preset: 'damaged' });
        expect(ship.helmState.health).toBeLessThan(fullHealth);
    });

    it('brings a target back a while after it\'s destroyed', () => {
        const { state, session } = createSession();
        session.start('phaserCannon');

        getHostileShips(state)[0].destroy();
        expect(getHostileShips(state).length).toBe(1);

        passTime(state, respawnDelayMs + 200);
        expect(getHostileShips(state).length).toBe(2);
    });

    it('plays a hull card from the hull\'s deck, and takes it back out once the range is set up afresh', () => {
        const { ship, session } = createSession();
        const hull = ship.hullState;
        const deckSize = hull.deck.length;
        const maxHealth = hull.maxHealth;

        session.start('hullVolatileEmitter');
        expect(hull.maxHealth).toBe(maxHealth + 1);
        expect(hull.deck.some(card => card.type === 'hullVolatileEmitter')).toBe(true);

        session.handle({ action: 'go', cardType: 'phaserCannon' });
        expect(hull.maxHealth).toBe(maxHealth);
        expect(hull.deck.length).toBe(deckSize);
        expect(hull.deck.some(card => card.type === 'hullVolatileEmitter')).toBe(false);
    });

    it('takes back the power it gave when another encounter is loaded', () => {
        const { state, ship, session } = createSession();
        const tactical = ship.tacticalState;
        const power = tactical.powerLevel;

        session.start('photonicCannon');
        expect(tactical.powerLevel).toBeGreaterThan(power);

        state.campaign!.devLoadEncounter('skirmish');
        expect(tactical.powerLevel).toBe(power);
        expect(session.getInfo().active).toBe(false);
    });

    it('refuses cards it doesn\'t know', () => {
        const { session } = createSession();

        expect(session.start('notACard')).toBe(false);
        expect(session.handle({ action: 'go', cardType: 'notACard' as CardType })).toBe(false);
    });
});

describe('Card range progress file', () => {
    function tempFile() {
        return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'card-range-')), 'docs', 'card-range.json');
    }

    it('saves and loads progress, dropping anything it doesn\'t understand', () => {
        const file = tempFile();
        const store = createFileStore(file);

        expect(store.load()).toEqual({ cards: {} });

        store.save({ current: 'flare', cards: { flare: { status: 'pass', note: 'Fine', preset: 'incoming' } } });
        expect(store.load()).toEqual({ current: 'flare', cards: { flare: { status: 'pass', note: 'Fine', preset: 'incoming' } } });

        fs.writeFileSync(file, JSON.stringify({ current: 3, cards: { flare: { status: 'maybe', note: 'Kept' }, phaserCannon: {} } }));
        expect(store.load()).toEqual({ cards: { flare: { note: 'Kept' } } });
    });

    it('leaves a file it can\'t read alone', () => {
        const file = tempFile();
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, '{ not json');

        const store = createFileStore(file);
        expect(store.load()).toEqual({ cards: {} });

        store.save({ cards: { flare: { status: 'pass' } } });
        expect(fs.readFileSync(file, 'utf-8')).toBe('{ not json');
    });
});
