import { hostileToPlayer } from 'src/campaign/factions';
import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { Encounter } from './Encounter';
import { getDefaultNode } from './EncounterRegistry';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { ObjectiveInfo } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import type { AiShip } from 'src/state/AiShip';
import type { CardState } from 'src/state/CardState';

const rooms = setupGameRoom();

/** An encounter that exposes the helpers that every encounter has, so each can be tried out on its own. */
class HelpfulEncounter extends Encounter {
    protected override readonly factions = [hostileToPlayer('them')];
    readonly happened: string[] = [];
    readonly removed: string[] = [];
    readonly harriers = this.track<AiShip>();

    protected populate(): void {}

    happenAfter(delayMs: number, what: string) {
        return this.after(delayMs, () => this.happened.push(what));
    }

    happenEvery(intervalMs: number, what: string, firstAfterMs?: number) {
        return this.every(intervalMs, () => this.happened.push(what), firstAfterMs);
    }

    spawnHarriers(count: number) {
        const harriers = this.spawnShips('them', Array.from({ length: count }, () => ({ design: 'harrier' as const })));
        this.harriers.add(...harriers);
        return harriers;
    }

    keep(role: CrewRoleName, cardType: CardType) {
        return this.keepInHand(role, cardType);
    }

    release(cards: CardState[]) {
        this.stopKeeping(cards);
    }

    finish() {
        this.complete();
    }

    changeObjective(objective: ObjectiveInfo) {
        this.setObjective(objective);
    }

    protected override onObjectRemoved(object: { id: string }): void {
        // The groups are already up to date.
        this.removed.push(`${object.id}:${this.harriers.has(object as AiShip) ? 'tracked' : 'gone'}`);
    }
}

function createEncounter() {
    const state = rooms.createState(seededRandom(3));
    const { campaign, ships } = startCampaign(state);
    campaign.devLoadEncounter('skirmish');

    const encounter = new HelpfulEncounter(state, getDefaultNode('skirmish'));
    Object.assign(campaign, { encounter });
    encounter.start();

    /** Moves game time on, and has the encounter catch up. */
    const wait = (ms: number) => {
        state.currentTime += ms;
        campaign.tick(0);
    };

    return { state, campaign, encounter, ship: ships[0], wait };
}

describe('Encounter timers', () => {
    it('run something once, after a while in game time', () => {
        const { encounter, wait } = createEncounter();
        encounter.happenAfter(5000, 'once');

        wait(4999);
        expect(encounter.happened).toEqual([]);

        wait(1);
        expect(encounter.happened).toEqual(['once']);

        wait(5000);
        expect(encounter.happened).toEqual(['once']);
    });

    it('run something every so often, only once however far the game jumps ahead', () => {
        const { encounter, wait } = createEncounter();
        encounter.happenEvery(1000, 'tick');

        wait(999);
        expect(encounter.happened).toEqual([]);

        wait(1);
        wait(1000);
        expect(encounter.happened).toEqual(['tick', 'tick']);

        wait(10_000);
        expect(encounter.happened).toHaveLength(3);
    });

    it('can start a repeating one sooner than its interval', () => {
        const { encounter, wait } = createEncounter();
        encounter.happenEvery(1000, 'tick', 0);

        wait(0);
        expect(encounter.happened).toEqual(['tick']);
    });

    it('can be cancelled', () => {
        const { encounter, wait } = createEncounter();
        encounter.happenAfter(1000, 'once').cancel();
        const repeating = encounter.happenEvery(1000, 'tick');

        wait(1000);
        repeating.cancel();
        wait(1000);

        expect(encounter.happened).toEqual(['tick']);
    });

    it('stop once the encounter is decided', () => {
        const { encounter, wait } = createEncounter();
        encounter.happenAfter(1000, 'once');
        encounter.happenEvery(1000, 'tick');

        encounter.finish();
        encounter.happenAfter(1000, 'too late');
        wait(1000);

        expect(encounter.happened).toEqual([]);
    });
});

describe('Encounter tracked objects', () => {
    it('drop out of their group as they leave the game, however they go, before the encounter hears of it', () => {
        const { encounter } = createEncounter();
        const [first, second, third] = encounter.spawnHarriers(3);
        expect(encounter.harriers.size).toBe(3);

        first.destroy();
        second.depart();

        expect(encounter.harriers.all).toEqual([third]);
        expect(encounter.removed).toEqual([`${first.id}:gone`, `${second.id}:gone`]);
    });

    it('can be gone through while they leave', () => {
        const { encounter } = createEncounter();
        encounter.spawnHarriers(3);

        for (const harrier of encounter.harriers) {
            harrier.destroy();
        }

        expect(encounter.harriers.size).toBe(0);
    });
});

describe('Encounter cards kept in hand', () => {
    it('are dealt to the crew member, and come back each time they are played', () => {
        const { ship, encounter } = createEncounter();
        const engineer = ship.engineerState;
        const [card] = encounter.keep('engineer', 'extendShields');

        expect(engineer.hand).toContain(card);
        Object.assign(engineer, { powerLevel: 5 });

        for (let i = 0; i < 3; i++) {
            expect(engineer.playCard(card.id, 'extendShields', 'no-target', '')).not.toBeNull();
            expect(engineer.hand.filter(candidate => candidate.type === 'extendShields')).toEqual([card]);
        }

        expect(engineer.deck).not.toContain(card);
    });

    it('come back when they are used up from a slot', () => {
        const { ship, encounter } = createEncounter();
        const science = ship.scienceState;
        const [card] = encounter.keep('science', 'tetryonScan');
        Object.assign(science, { powerLevel: 5 });

        expect(science.playCard(card.id, 'tetryonScan', 'scan', 'deflector/substance')).not.toBeNull();
        expect(science.hand).not.toContain(card);

        science.unmountSubstanceCard();

        expect(science.hand).toContain(card);
        expect(science.deck).not.toContain(card);
    });

    it('can\'t be discarded', () => {
        const { ship, encounter } = createEncounter();
        const [card] = encounter.keep('engineer', 'extendShields');

        expect(ship.engineerState.discardCard(card.id)).toBe(false);
        ship.engineerState.discard(10);

        expect(ship.engineerState.hand).toContain(card);
    });

    it('go once they are no longer kept: straight away from the hand, or once used up from a slot', () => {
        const { ship, encounter } = createEncounter();
        const science = ship.scienceState;
        const [inHand] = encounter.keep('science', 'polaronScan');
        const [inSlot] = encounter.keep('science', 'tetryonScan');
        Object.assign(science, { powerLevel: 5 });
        science.playCard(inSlot.id, 'tetryonScan', 'scan', 'deflector/substance');

        encounter.release([inHand, inSlot]);
        expect(science.hand).not.toContain(inHand);

        science.unmountSubstanceCard();
        expect(science.hand).not.toContain(inSlot);
        expect(science.deck).not.toContain(inSlot);
    });

    it('are gone once the encounter is over', () => {
        const { campaign, ship, encounter } = createEncounter();
        const [card] = encounter.keep('engineer', 'extendShields');

        campaign.devLoadEncounter('repairStation');

        expect(ship.engineerState.hand).not.toContain(card);
        expect(ship.engineerState.deck).not.toContain(card);
    });
});

describe('Encounter objective', () => {
    it('can be changed: the viewscreen and the summary show the new one, and the node keeps the old', () => {
        const { state, encounter } = createEncounter();
        expect(state.objective?.type).toBe('clear');

        encounter.changeObjective({ type: 'protect', subject: 'the keepers\' boat' });

        expect({ type: state.objective?.type, subject: state.objective?.subject }).toEqual({ type: 'protect', subject: 'the keepers\' boat' });
        expect(state.encounter?.objective).toEqual({ type: 'protect', subject: 'the keepers\' boat' });
        expect(encounter.node.objective).toEqual({ type: 'clear' });
    });

    it('is the next encounter\'s own once this one is over', () => {
        const { state, campaign, encounter } = createEncounter();
        encounter.changeObjective({ type: 'protect', subject: 'the keepers\' boat' });

        campaign.devLoadEncounter('skirmish');

        expect(state.objective?.type).toBe('clear');
        expect(state.objective?.subject).toBe('');
    });
});
