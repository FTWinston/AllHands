import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { distance } from 'common-data/features/space/utils/vectors';
import { playerFactionId } from 'src/campaign/factions';
import { getPlayerShips } from 'src/utils/shipQueries';
import { Encounter } from './Encounter';
import type { EncounterDefinition } from './EncounterDefinition';
import type { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import type { FactionConfig } from 'common-data/features/space/types/FactionConfig';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { AiShip } from 'src/state/AiShip';
import type { CardState } from 'src/state/CardState';
import type { Ship } from 'src/state/Ship';

const wardens = 'wardens';
const keepers = 'keepers';
/** Elite: the picket that has stopped answering roll-call, which is on nobody's side until the crew is seen. */
const defectors = 'defector';

const keeper = 'Ketch Relay';
export const relayScenarioId = 'ketchRelay';

/** How far ahead of the player ships the relay is. */
export const relayDistance = 70;
/** How far from the relay its pickets sit, all the way round. */
export const ringRadius = 28;
export const picketCount = 6;
export const elitePicketCount = 8;
const picketSkill = 0.7;
/** How far round each picket's own position it holds, until the crew is seen. Past every weapon's reach. */
const postRadius = 30;

/** How far a picket can see the crew from, however much power it shows. */
export const sightRange = 24;
/** How often each picket looks for the crew. */
export const watchIntervalMs = 500;
/** What a picket's sensors step through, one step every `sensorStepMs`, starting from a random point. It's the level its science system reads, on a scan. */
export const sensorCycle = [1, 3, 5, 3] as const;
export const sensorStepMs = 10_000;
/** What an elite form's defector's sensors read, always. */
export const defectorSensor = 0;

/** How long after a flare goes out every picket's sensors stay at their highest, before they pick up their cycle again. */
export const alertMs = 20_000;
export const alertSensor = 5;
/** How many flares tactical is given. After that it has whatever it bought. */
export const flaresGiven = 2;

/** How long the keeper can hold the relay's door open. */
export const windowMs = 180_000;
/** How close a player ship has to come to the relay to have reached it. */
export const arrivalRadius = 3;

/** The systems whose power the pickets watch for. */
const signatureSystems: readonly ShipSystem[] = ['hull', 'reactor', 'helm', 'science', 'tactical', 'engineer'];

/** How much power a ship shows: the sum of its six systems' power. 18 as the crew arrives, and 6 with every system running quiet. */
export function signatureOf(ship: Ship): number {
    return signatureSystems.reduce((sum, system) => sum + ship.getSystem(system).powerLevel, 0);
}

/** The most power a picket can be shown, at this distance, with its sensors at this level, without seeing it. More is seen. */
export function allowance(distanceToPicket: number, sensor: number): number {
    return 6 + distanceToPicket / 2 + (3 - sensor) * 2;
}

const numberNames = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

const briefing = 'They watch for power. The closer you pass, the less you can show. And their sensors breathe: up, down, up. Catch two of them low and go between. I can hold the door three minutes.';
const eliteBriefing = `${briefing} One of them's stopped answering roll-call. I don't know which.`;

/**
 * The keeper of a relay needs a part the crew is carrying, and the Wardens have a cordon of pickets round it, which mustn't see the crew arrive.
 * - The pickets sit on a ring round the relay, and aren't hostile. Each sees a player ship that's within its sight and showing more power than it allows.
 *   The closer the ship, the less it allows, and less again the harder its sensors are running. Those step up and down every ten seconds,
 *   and a scan of a picket's science system shows where they are.
 * - The engineer always has Run Quiet, which takes power from a system until it's played on it again. Tactical has a flare, twice:
 *   while one burns no picket sees anything, and when it goes out every picket's sensors run at their highest for a while.
 * - Being seen, or firing on a picket, turns the Wardens hostile, and every picket hunts the crew.
 * - It's a success once a player ship reaches the relay, seen or not. The keeper can hold the door for three minutes, and says when one minute and twenty seconds are left.
 *   It's a failure when the door closes. Pickets that never saw the crew are still neutral then.
 *
 * Elite: there are more pickets, closer together, and one has defected. Its sensors read nothing, and it never sees anything.
 * If the crew is seen it turns on the Wardens.
 */
export class QuietRunningEncounter extends Encounter {
    protected override readonly factions: readonly FactionConfig[] = [
        { id: wardens, relations: { [playerFactionId]: RelationshipType.Neutral } },
        { id: keepers, relations: { [playerFactionId]: RelationshipType.Friendly } },
        // Elite: neutral to everyone, until the crew is seen.
        { id: defectors },
    ];

    private relay: AiShip | undefined;
    private readonly picketShips = this.track<AiShip>();
    /** Elite: the one picket that won't see anything. */
    private defectorShip: AiShip | null = null;
    /** Where in its cycle each picket's sensors started, in game time. */
    private readonly sensorPhaseMs = new Map<AiShip, number>();
    private startTime = 0;

    private seenBy: AiShip | null = null;
    private flareCards: CardState[] = [];
    private flaresSeen = 0;
    /** When each player ship's last flare was launched, so that each new one is counted once. */
    private readonly flareLaunchedAt = new Map<Ship, number>();
    private flareWasBurning = false;
    /** Game time until which every picket's sensors are at their highest, after a flare. */
    private alertUntil = 0;

    /** The pickets, in order round the ring, the defector included. */
    get pickets(): readonly AiShip[] {
        return this.picketShips.all;
    }

    /** Elite: the picket that won't see anything. */
    get defector(): AiShip | null {
        return this.defectorShip;
    }

    /** Whether a picket has seen the crew, or been fired on by them. */
    get isSeen(): boolean {
        return this.seenBy !== null;
    }

    /** Whether a flare from a player ship is burning, so no picket can see anything. */
    get isFlareBurning(): boolean {
        return getPlayerShips(this.state).some(ship => ship.engineerState.systems.some(tile => tile.system === 'tactical' && tile.hasEffect('flareBurning')));
    }

    /** How hard a picket's sensors are running just now: 1, 3 or 5, or 0 for a defector. Its science system reads this. */
    sensorLevel(picket: AiShip): number {
        if (picket === this.defectorShip) {
            return defectorSensor;
        }

        if (this.state.currentTime < this.alertUntil) {
            return alertSensor;
        }

        const elapsed = this.state.currentTime - this.startTime + (this.sensorPhaseMs.get(picket) ?? 0);
        return sensorCycle[Math.floor(elapsed / sensorStepMs) % sensorCycle.length];
    }

    /** Puts a picket's sensors at the start of a step at the given level, on the way up where there's a choice. For tests, and for nothing in the game. */
    setSensors(picket: AiShip, level: 1 | 3 | 5): void {
        const step = sensorCycle.indexOf(level);
        const cycleMs = sensorCycle.length * sensorStepMs;
        const phase = (step * sensorStepMs - (this.state.currentTime - this.startTime)) % cycleMs;
        this.sensorPhaseMs.set(picket, (phase + cycleMs) % cycleMs);
        this.mirrorSensors();
    }

    override start(): void {
        // Before the pickets are placed, as their sensors' cycles are counted from now.
        this.startTime = this.state.currentTime;
        super.start();

        this.hail(keeper, this.node.elite ? eliteBriefing : briefing);

        this.keepInHand('engineer', 'runQuiet');
        this.flareCards = this.keepInHand('tactical', 'flare');

        this.after(windowMs - 60_000, () => this.hail(keeper, 'One minute, then I have to go dark.', { urgent: true }));
        this.after(windowMs - 20_000, () => this.hail(keeper, 'Twenty seconds.', { urgent: true }));
        this.after(windowMs, () => this.doorCloses());
        this.every(watchIntervalMs, () => this.watch());
    }

    protected populate(): void {
        // The player ships start at the origin facing along the x axis. The relay is straight ahead.
        const centre: Vector2D = { x: relayDistance, y: 0 };

        const [relay] = this.spawnShips(keepers, [{
            design: 'relay',
            scenarioId: relayScenarioId,
            name: keeper,
            position: { ...centre, angle: Math.PI },
        }]);
        this.relay = relay;

        // The ring is turned by a random angle, so there may be a gap or a picket straight ahead.
        const count = this.node.elite ? elitePicketCount : picketCount;
        const turn = this.state.random.getFloat(0, Math.PI * 2);
        const cycleMs = sensorCycle.length * sensorStepMs;

        const spawns = numberNames.slice(0, count).map((number, index) => {
            const bearing = turn + index * Math.PI * 2 / count;
            const position = { x: centre.x + Math.cos(bearing) * ringRadius, y: centre.y - Math.sin(bearing) * ringRadius, angle: bearing };

            return {
                design: 'picket' as const,
                name: `Warden Picket ${number}`,
                position,
                goal: { type: 'defend-position' as const, position, radius: postRadius },
                skill: picketSkill,
            };
        });

        // Elite: the defector stays in the ring, where it was, and looks like the rest. Only its side is different.
        // They're spawned one at a time, in order round the ring, as target lists show ships in the order they were spawned.
        const defectorIndex = this.node.elite ? this.state.random.getInt(count) : -1;
        const pickets = spawns.map((spawn, index) => this.spawnShips(index === defectorIndex ? defectors : wardens, [spawn])[0]);
        this.defectorShip = pickets[defectorIndex] ?? null;

        this.picketShips.add(...pickets);

        for (const picket of pickets) {
            this.sensorPhaseMs.set(picket, this.state.random.getFloat(0, cycleMs));
            picket.hitReceived.addListener('quietRunning', ({ damage }) => {
                if (damage.sourceId !== undefined && getPlayerShips(this.state).some(ship => ship.id === damage.sourceId)) {
                    this.firedOn(picket);
                }
            });
        }

        this.mirrorSensors();
    }

    protected override tick(): void {
        if (this.isComplete || !this.relay) {
            return;
        }

        this.mirrorSensors();
        this.followFlares();

        const relayPosition = this.relay.getPosition(this.state.currentTime);
        if (getPlayerShips(this.state).some(ship => distance(ship.getPosition(this.state.currentTime), relayPosition) <= arrivalRadius)) {
            this.arrive();
        }
    }

    /** A scan of a picket's science system reads its sensor level, whatever its own engineer does with the power. */
    private mirrorSensors(): void {
        for (const picket of this.picketShips) {
            const science = picket.scienceState;
            const level = this.sensorLevel(picket);

            // Power can be pushed past either end of its range, so it may take more than one step to show.
            for (let i = 0; i < 10 && science.powerLevel !== level; i++) {
                science.adjustPowerLevel(Math.sign(level - science.powerLevel));
            }
        }
    }

    /** Counts each flare as it's launched, stops giving them out after the last, and has every picket's sensors flare up as each goes out. */
    private followFlares(): void {
        for (const ship of getPlayerShips(this.state)) {
            const burning = ship.engineerState.systems.find(tile => tile.system === 'tactical')?.effects.find(effect => effect.type === 'flareBurning');
            const launchedAt = burning?.progress?.startTime;

            if (launchedAt !== undefined && launchedAt !== this.flareLaunchedAt.get(ship)) {
                this.flareLaunchedAt.set(ship, launchedAt);
                this.flaresSeen++;

                if (this.flaresSeen === flaresGiven) {
                    this.stopKeeping(this.flareCards);
                }
            }
        }

        const burning = this.isFlareBurning;
        if (this.flareWasBurning && !burning) {
            this.alertUntil = this.state.currentTime + alertMs;
            this.mirrorSensors();
        }
        this.flareWasBurning = burning;
    }

    /** Each picket looks for each player ship, unless a flare is burning. The first to see one says so. */
    private watch(): void {
        if (this.isSeen || this.isFlareBurning) {
            return;
        }

        const now = this.state.currentTime;

        for (const picket of this.picketShips) {
            if (picket === this.defectorShip) {
                continue;
            }

            const from = picket.getPosition(now);
            const sensor = this.sensorLevel(picket);

            for (const ship of getPlayerShips(this.state)) {
                const range = distance(from, ship.getPosition(now));
                if (range <= sightRange && signatureOf(ship) > allowance(range, sensor)) {
                    this.seen(picket);
                    return;
                }
            }
        }
    }

    private firedOn(picket: AiShip): void {
        if (!this.isComplete && !this.isSeen && picket !== this.defectorShip) {
            this.seen(picket);
        }
    }

    /** The Wardens turn hostile, and every picket hunts the crew. The door stays open as long as it was going to. */
    private seen(by: AiShip): void {
        this.seenBy = by;

        this.state.factionRegistry.setRelationship(wardens, playerFactionId, RelationshipType.Hostile);
        for (const picket of this.picketShips) {
            if (picket !== this.defectorShip) {
                picket.ai.commander.setGoal({ type: 'search-and-destroy' });
            }
        }

        this.hail(by.name, 'Contact in the cordon. Unregistered. All pickets, converge.', { urgent: true });

        const defector = this.defectorShip;
        if (defector) {
            this.state.factionRegistry.setRelationship(defectors, wardens, RelationshipType.Hostile);
            this.state.factionRegistry.setRelationship(defectors, playerFactionId, RelationshipType.Friendly);
            defector.ai.commander.setGoal({ type: 'search-and-destroy' });
            this.hail(defector.name, `${defector.name.replace('Warden ', '')} to the unregistered ship. Go. I'll keep them looking at me.`, { urgent: true });
        }

        this.hail(keeper, 'They\'ve seen you. Run for it. The door\'s open.');
    }

    /** A player ship reached the relay. Whoever was hunting it loses it at the door. */
    private arrive(): void {
        const seen = this.isSeen;

        for (const picket of this.picketShips) {
            if (picket !== this.defectorShip) {
                picket.ai.commander.standDown();
            }
        }

        this.complete('success');
        this.hail(keeper, seen
            ? 'Subtle. Still, that\'s the coupler. Go on, before they work out where you went.'
            : 'I didn\'t see a thing, and neither did they. That\'s the coupler. Thank you.');
    }

    private doorCloses(): void {
        this.complete('failure');
        this.silence();
        this.hail(keeper, 'That\'s my window. Going dark. Don\'t lead them here.');
    }
}

export const quietRunningDefinition: EncounterDefinition = {
    id: 'quietRunning',
    name: 'Quiet Running',
    kind: 'combat',
    objective: { type: 'reach', subject: 'Ketch Relay' },
    defaultEnvironment: 'nebula',
    request: {
        from: 'Keeper, Ketch Relay',
        subject: 'parts run',
        text: 'The Wardens have a cordon round my relay and I\'m down to one good coupler. You\'ve got the spare. Come in quiet. They watch for power, not for ships.',
    },
    create: (state, node) => new QuietRunningEncounter(state, node),
};
