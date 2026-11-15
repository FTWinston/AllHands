import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { distance } from 'common-data/features/space/utils/vectors';
import { playerFactionId } from 'engine/campaign/factions';
import { Encounter } from 'engine/encounters/Encounter';
import { getPlayerShips } from 'engine/utils/shipQueries';
import type { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import type { FactionConfig } from 'common-data/features/space/types/FactionConfig';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { EncounterDefinition } from 'engine/encounters/EncounterDefinition';
import type { AiShip } from 'engine/state/AiShip';
import type { CardState } from 'engine/state/CardState';
import type { Ship } from 'engine/state/Ship';

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

/**
 * How close the crew has to come to a picket to be watched at all. Once it's that close to any of them, the two pickets nearest it watch it,
 * so a ship between two pickets is watched by both, however near one it flies. On a gap's middle line that's 15.5 units of flying (23.8 with eight pickets).
 */
export const sightRange = 16;
/** How often each picket looks for the crew. */
export const watchIntervalMs = 500;
/** What a picket's sensors step through, one step every `sensorStepMs`, starting from a random point. It's the level its science system reads, on a scan. */
export const sensorCycle = [1, 3, 5, 3] as const;
export const sensorStepMs = 10_000;
/** What an elite form's defector's sensors read, always. */
export const defectorSensor = 0;
/** The highest a picket's sensors go. They see anything then. */
export const highSensor = 5;

/** The most power a picket can be shown without seeing it, with its sensors low (1) and middle (3). On high (5) it sees anything. */
const allowances: Readonly<Record<number, number>> = { 1: 14, 3: 10 };

/** One gap on the crew's side of the ring has its two pickets' sensors this close together in their cycles, so that it's open for 26 to 30 seconds of every 40. */
export const inStepMs = 4_000;
/**
 * How far round the ring from the crew's straight line in that gap may be: its middle is within this angle of the line from the relay to where the crew starts.
 * The elite form's defector is within it too.
 */
export const facingArc = 75 * Math.PI / 180;

/** How long after a flare goes out every picket's sensors stay at their highest, before they pick up their cycle again. */
export const alertMs = 20_000;
export const alertSensor = highSensor;
/** How many flares tactical is given. After that it has whatever it bought. One, as two launched back to back cover a whole crossing. */
export const flaresGiven = 1;

/** What reaching the relay is worth if the crew was seen on the way. */
export const seenScore = 0.5;

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

/** The most power a picket can be shown, with its sensors at this level, without seeing it. More is seen. On high, nothing is allowed. */
export function allowance(sensor: number): number {
    return allowances[sensor] ?? -Infinity;
}

const numberNames = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

const briefing = 'They add up all your power. Their sensors breathe: low, middle, high, middle. High sees anything. Middle lets you show ten, low fourteen. Find two breathing together, and go between them as they drop. I can hold the door three minutes.';
const eliteBriefing = `${briefing} One of them's stopped answering roll-call. I don't know which.`;

/**
 * The keeper of a relay needs a part the crew is carrying, and the Wardens have a cordon of pickets round it, which mustn't see the crew arrive.
 * - The pickets sit on a ring round the relay, and aren't hostile. A player ship that comes within sight of one is watched by the two nearest it,
 *   and seen if it's showing more power than either one's sensors allow just then: 14 on low, 10 on middle, and nothing on high.
 *   Those step low, middle, high, middle, every ten seconds, and a scan of a picket's science system shows where they are.
 *   So a gap can only be crossed while both its pickets are off high, and one gap facing the crew has its two in step.
 * - The engineer always has Run Quiet, which takes power from a system until it's played on it again. Tactical has a flare, once:
 *   while it burns no picket sees anything, and when it goes out every picket's sensors run at their highest for a while.
 * - Being seen, or firing on a picket, turns the Wardens hostile, and every picket hunts the crew.
 * - It's a success once a player ship reaches the relay, worth half if they were seen. The keeper can hold the door for three minutes,
 *   and says when one minute and twenty seconds are left. It's a failure when the door closes. Pickets that never saw the crew are still neutral then.
 *
 * Elite: there are more pickets, closer together, and one has defected. Its sensors read nothing, and it never sees anything,
 * so the gaps either side of it have only one picket watching. No gap is put in step. If the crew is seen it turns on the Wardens.
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
    /** The two pickets either side of the gap whose sensors were put in step. None in the elite form. */
    private inStepPair: readonly [AiShip, AiShip] | null = null;

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

    /** The two pickets either side of the gap whose sensors were put in step, in order round the ring. Null in the elite form. */
    get inStepGap(): readonly [AiShip, AiShip] | null {
        return this.inStepPair;
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

    /** Whether a picket watching a ship that shows this much power sees it, with its sensors where they are now. The defector never does. */
    sees(picket: AiShip, signature: number): boolean {
        return picket !== this.defectorShip && signature > allowance(this.sensorLevel(picket));
    }

    /** Puts a picket's sensors at the start of a step at the given level, on the way up where there's a choice. For tests, and for nothing in the game. */
    setSensors(picket: AiShip, level: 1 | 3 | 5): void {
        const step = sensorCycle.indexOf(level);
        const cycleMs = sensorCycle.length * sensorStepMs;
        const phase = (step * sensorStepMs - (this.state.currentTime - this.startTime)) % cycleMs;
        this.sensorPhaseMs.set(picket, (phase + cycleMs) % cycleMs);
        this.mirrorSensors();
    }

    /** Puts a picket's sensors this far behind another's in their cycle, or ahead if it's negative. The game does it once, for the gap it puts in step. */
    putInStep(picket: AiShip, leader: AiShip, behindMs: number): void {
        const cycleMs = sensorCycle.length * sensorStepMs;
        const phase = (this.sensorPhaseMs.get(leader) ?? 0) - behindMs;
        this.sensorPhaseMs.set(picket, (phase % cycleMs + cycleMs) % cycleMs);
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
        /** How far round the ring from the crew's straight line in a point at this bearing from the relay is. The crew comes from bearing pi. */
        const offLine = (bearing: number) => Math.abs(Math.atan2(Math.sin(bearing - Math.PI), Math.cos(bearing - Math.PI)));

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
        // It's one of those on the crew's side, as one on the far side of the ring would be too far round to reach before the door closes.
        // They're spawned one at a time, in order round the ring, as target lists show ships in the order they were spawned.
        const facingIndexes = spawns.map((_, index) => index).filter(index => offLine(turn + index * Math.PI * 2 / count) <= facingArc);
        const defectorIndex = this.node.elite ? facingIndexes[this.state.random.getInt(facingIndexes.length)] : -1;
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

        // One gap on the crew's side has its two pickets in step, so that it's open for most of every cycle. Which one is random.
        // The rest fall as they fall. The elite form has none: the defector's the way through.
        if (!this.node.elite) {
            const facing = pickets
                .map((left, index) => ({ left, right: pickets[(index + 1) % count], middle: turn + (index + 0.5) * Math.PI * 2 / count }))
                .filter(({ middle }) => offLine(middle) <= facingArc);
            const { left, right } = facing[this.state.random.getInt(facing.length)];
            this.putInStep(right, left, this.state.random.getFloat(-inStepMs, inStepMs));
            this.inStepPair = [left, right];
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

    /** The two pickets nearest a player ship watch it, once it's within sight of either, unless a flare is burning. The first to see one says so. */
    private watch(): void {
        if (this.isSeen || this.isFlareBurning) {
            return;
        }

        const now = this.state.currentTime;

        for (const ship of getPlayerShips(this.state)) {
            const position = ship.getPosition(now);
            const nearest = this.picketShips.all
                .map(picket => ({ picket, range: distance(picket.getPosition(now), position) }))
                .sort((a, b) => a.range - b.range)
                .slice(0, 2);

            if (nearest.length === 0 || nearest[0].range > sightRange) {
                continue;
            }

            const signature = signatureOf(ship);
            const seenBy = nearest.find(({ picket }) => this.sees(picket, signature));
            if (seenBy) {
                this.seen(seenBy.picket);
                return;
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

    /** A player ship reached the relay, which is worth half if they were seen. Whoever was hunting it loses it at the door. */
    private arrive(): void {
        const seen = this.isSeen;

        for (const picket of this.picketShips) {
            if (picket !== this.defectorShip) {
                picket.ai.commander.standDown();
            }
        }

        this.complete('success', seen ? seenScore : 1);
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
