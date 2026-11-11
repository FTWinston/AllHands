import { crewRoleNames, type CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { seededRandom, setupGameRoom, startCampaign } from 'src/testUtils';
import { describe, expect, it } from 'vitest';
import { ostlerScenarioId, type FeverShipEncounter } from './FeverShipEncounter';
import type { WeaponTrait } from 'common-data/features/cards/types/CardTrait';
import type { AiShip } from 'src/state/AiShip';
import type { GameState } from 'src/state/GameState';
import type { PlayerShip } from 'src/state/PlayerShip';

const rooms = setupGameRoom();

/** A campaign running Fever Ship with the update in the given system. The encounter is loaded again until the random pick comes out that way. */
function createFeverShip(infected: CrewRoleName, { seed = 3, elite = false } = {}) {
    const state = rooms.createState(seededRandom(seed));
    const { campaign, ships } = startCampaign(state);

    for (let attempt = 0; attempt < 50; attempt++) {
        campaign.devLoadEncounter('feverShip', elite);
        const encounter = campaign.activeEncounter as FeverShipEncounter;

        if (encounter.infectedSystem === infected) {
            return { state, encounter, ship: ships[0], ostler: state.getObjectByScenarioId(ostlerScenarioId) as AiShip };
        }
    }

    throw new Error(`Fever Ship never infected ${infected}`);
}

/** Plays the encounter out, AI and all, until it's decided, the game is over, or time's up. The room's timers aren't otherwise running, so those are moved on as well. */
function run(state: GameState, maxMs: number, eachTick?: (elapsedMs: number) => void) {
    const tick = 100;
    let elapsed = 0;

    for (; elapsed < maxMs && state.encounter?.outcome === null; elapsed += tick) {
        eachTick?.(elapsed);
        state.tick(tick);

        for (const delayed of [...rooms.getClock().delayed]) {
            if (delayed.active) {
                delayed.tick(tick);
            }
        }
    }

    // The game ends, and the encounter with it, if the crew is destroyed.
    return { seconds: elapsed / 1000, outcome: state.encounter ? state.encounter.outcome : 'crew destroyed' as const };
}

const weapons: Record<'strip' | 'torpedo', { amount: number; traits: WeaponTrait[] }> = {
    strip: { amount: 10, traits: ['energyWeapon'] },
    torpedo: { amount: 40, traits: ['torpedoWeapon'] },
};

/**
 * Tactical lands a shot on each of these systems in turn, one every `intervalMs` from the first, moving on to the next once it's out.
 * Shots always hit: this is about what each hit costs her, not about aiming.
 */
function shootAt(ship: PlayerShip, ostler: AiShip, systems: CrewRoleName[], weapon: keyof typeof weapons, intervalMs: number, firstAtMs = 0) {
    const order = [...systems];

    return (elapsedMs: number) => {
        if (elapsedMs < firstAtMs || (elapsedMs - firstAtMs) % intervalMs !== 0 || order.length === 0) {
            return;
        }

        while (order.length > 1 && ostler.getCrewSystem(order[0]).health <= 0) {
            order.shift();
        }

        ostler.damage({ ...weapons[weapon], targetSystem: order[0], sourceId: ship.id });
    };
}

/** What a played-out Fever Ship comes to, which says whether it's tuned right, rather than whether it works. */
describe('FeverShipEncounter balance', () => {
    it.each(['helm', 'science', 'engineer'] as const)('a crew that does nothing loses most of its shields to her strips in four minutes, but lives (%s infected)', (infected) => {
        const { state, ship } = createFeverShip(infected);

        const { outcome } = run(state, 240_000);

        expect(outcome).toBeNull();
        expect(ship.hullState.shield).toBeLessThan(ship.hullState.maxShield / 2);
        expect(ship.hullState.shield).toBeGreaterThan(0);
    });

    it('science gets a new scan card every six seconds, on top of the one it starts with', () => {
        const { state, ship } = createFeverShip('helm');
        const drawnAt: number[] = [];
        const start = state.currentTime;
        ship.scienceState.cardAddedToHand.addListener('balance', () => drawnAt.push(state.currentTime - start));

        // Science plays each card as it comes, so the hand never fills.
        run(state, 60_000, () => ship.scienceState.discard(ship.scienceState.hand.length));

        // So finding the right one of four scan slots (one to four cards), then reading its hand (one more), takes up to half a minute.
        expect(drawnAt.length).toBe(10);
        expect(drawnAt[0]).toBeLessThanOrEqual(6000);
        expect(drawnAt[3]).toBeLessThanOrEqual(24_000);
    });

    it.each([3, 7])('a crew that does nothing against her torpedoes is destroyed inside two minutes (seed %i)', (seed) => {
        const { state } = createFeverShip('tactical', { seed });

        const { outcome, seconds } = run(state, 240_000);

        expect(outcome).toBe('crew destroyed');
        expect(seconds).toBeLessThan(120);
    });

    it.each(crewRoleNames)('a crew that puts a strip on the right system every ten seconds stops her inside a minute, with most of her hull left (%s infected)', (infected) => {
        const { state, ship, ostler } = createFeverShip(infected);

        const { outcome, seconds } = run(state, 240_000, shootAt(ship, ostler, [infected], 'strip', 10_000, 10_000));

        expect(outcome).toBe('success');
        expect(seconds).toBeLessThan(60);
        expect(ostler.hullState.health).toBeGreaterThanOrEqual(13);
    });

    it.each(crewRoleNames)('a crew that puts out the wrong system first still stops her, with less of her hull to spare (%s infected)', (infected) => {
        const { state, ship, ostler } = createFeverShip(infected);
        const wrong = crewRoleNames.find(role => role !== infected)!;

        const { outcome } = run(state, 240_000, shootAt(ship, ostler, [wrong, infected], 'strip', 10_000, 10_000));

        expect(outcome).toBe('success');
        expect(ostler.hullState.health).toBeGreaterThanOrEqual(8);
        expect(ostler.hullState.health).toBeLessThan(13);
    });

    it('a crew that only uses torpedoes can afford two wrong guesses with her shields up, but not a third shot', () => {
        const { state, ship, ostler } = createFeverShip('engineer');

        const { outcome } = run(state, 240_000, shootAt(ship, ostler, ['helm', 'tactical', 'engineer'], 'torpedo', 10_000, 10_000));

        expect(outcome).toBe('failure');
    });

    it('elite: a crew that knows where the update went still stops her, with about half her hull left', () => {
        const { state, encounter, ship, ostler } = createFeverShip('tactical', { elite: true });
        let target: CrewRoleName = 'tactical';

        const { outcome } = run(state, 240_000, (elapsedMs) => {
            target = encounter.infectedSystem;
            shootAt(ship, ostler, [target], 'strip', 10_000, 10_000)(elapsedMs);
        });

        expect(outcome).toBe('success');
        expect(ostler.hullState.health).toBeGreaterThanOrEqual(6);
        expect(ostler.hullState.health).toBeLessThan(13);
    });
});
