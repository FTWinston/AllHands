import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { playerFactionId } from '../campaign/factions';
import { Encounter, type EncounterTimer } from './Encounter';
import type { EncounterDefinition } from './EncounterDefinition';
import type { FactionConfig } from 'common-data/features/space/types/FactionConfig';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { AiShip } from 'src/state/AiShip';
import type { GameObject } from 'src/state/GameObject';
import type { HullSystemTile } from 'src/state/systems/engineer/HullSystemTile';
import type { RemovalReason } from 'src/types/RemovalReason';

const corrie = 'corrie';
const evacuees = 'shuttles';
const grid = 'grid';

const station = 'Corrie Deep Station';
export const stationScenarioId = 'corrieDeep';

/** The station is this far to port of where the player ships start. */
export const stationOffset = 8;
/** How long each lane is, from the station to where a shuttle jumps away. */
export const laneLength = 35;
/** How far apart the three lanes are fanned. The centre one runs the way the player ships start out facing. */
export const laneSpread = Math.PI * 40 / 180;
/** How close a shuttle, or a dead fragment, has to get to the end of its route to have reached it. */
const arrivalRadius = 2;

/** The lanes, from port to starboard, and how far each is turned from the centre one (a positive turn is to port). */
export const lanes = [
    { name: 'port', turn: laneSpread },
    { name: 'centre', turn: 0 },
    { name: 'starboard', turn: -laneSpread },
] as const;

export const shuttleCount = 6;
/** When the first shuttle launches, which leaves time for the briefing to be read before the first launch is called. */
export const firstLaunchMs = 20_000;
/** How long after each launch the next one is, on the station's schedule. About as long as a shuttle takes to fly its lane. */
export const launchIntervalMs = 40_000;
/** How long before each launch the station calls it. A call that can't be said within `launchCallMaxDelayMs` isn't said at all. */
export const launchWarningMs = 5000;
const launchCallMaxDelayMs = 3000;

/** How many fragments of the old defence grid come with each shuttle, and how many of those still have a working gun. */
export const fragmentWaves = [3, 3, 4, 4, 4, 5] as const;
export const liveInWave = [1, 1, 2, 2, 2, 3] as const;
/** How far from the middle of its shuttle's lane each fragment arrives. They come from either side of the lane, never from along it. */
export const fragmentSpawnDistance = 30;
/** How far either side of square on to its lane a fragment can come from. */
const fragmentSpread = Math.PI / 4;
/** How far along its lane from the middle a dead fragment can cross it. */
const crossingSpread = 8;
/** How far to either side of a straight line a dead fragment's drift wanders at each turn. */
const driftWander = 4;
const fragmentSkill = 0.6;

/** Full marks, so it flies straight down its lane. */
const shuttleSkill = 1;

/** How long after the fourth launch the station asks whether to send the last two together, and how long there is to answer. */
export const questionDelayMs = 5000;
export const questionTimeoutMs = 15_000;
/** How long after the answer the last two go, if they're sent together. */
export const sendBothDelayMs = 5000;
export const scheduleAnswers = { sendBoth: 'sendBoth', hold: 'hold' } as const;

/** Elite: after the third launch the station asks whether to launch the rest cold, and if so, this far apart. */
export const coldLaunchIntervalMs = 25_000;
/** Elite: when the station's reactor fails, and nothing more can launch. Ten seconds before the last shuttle was due. */
export const reactorFailsAtMs = 210_000;
export const coldAnswers = { cold: 'cold', keepChecks: 'keepChecks' } as const;

const numberNames = [
    'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
    'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty', 'Twenty-One', 'Twenty-Two', 'Twenty-Three', 'Twenty-Four', 'Twenty-Five',
];
const numberName = (index: number) => numberNames[index] ?? `${index + 1}`;

const briefing = 'Six shuttles, forty seconds apart. I\'ll call each lane before it goes. Most of what\'s drifting out there is dead. Some of it still has a gun, and from here they look the same. Your sensors can tell.';

type Lane = typeof lanes[number];

interface Shuttle {
    /** Which shuttle this is: 0 is Shuttle One. */
    index: number;
    lane: Lane | null;
    ship: AiShip | null;
    /** Whether it's still waiting to launch, on its way, or done with. */
    status: 'waiting' | 'flying' | 'saved' | 'lost';
}

/**
 * A mining station whose reactor is failing launches six shuttles, one at a time, down one of three lanes, and the crew has to cover them.
 * - The station calls each launch and its lane five seconds ahead. Never the same lane twice running.
 * - With each shuttle come a few fragments of the station's old defence grid. Most are dead, and drift across the lanes and away.
 *   Some still have a working cannon, and go for the shuttle they came with. They're seldom in reach before it's gone, so it's the next shuttle
 *   they fire on, and the one after that, until they're destroyed. They never fire on the crew. They look the same: only a scan
 *   of a fragment's tactical system tells for certain, as a live one's weapon slot has a cannon in it.
 * - The engineer always has Extend Shields to play, which covers a shuttle while helm keeps close. The crew's shields don't come back.
 * - A shuttle that reaches the end of its lane jumps away, saved. The station counts aloud, each as it goes or is lost.
 * - After the fourth launch the station asks whether to send the last two together, straight away. One ship can't cover both.
 * - It's over once every shuttle is saved or lost, and graded by how many were saved. None is a failure. Live fragments stay until the crew leaves.
 *
 * Elite: the station can't keep the schedule. After the third launch it asks whether to launch the rest cold, every 25 seconds with their shields down,
 * or keep the checks and lose the last one to the reactor.
 */
export class LastShuttleOutEncounter extends Encounter {
    protected override readonly factions: readonly FactionConfig[] = [
        // The station is a faction of its own, so nothing shoots at it.
        { id: corrie, relations: { [playerFactionId]: RelationshipType.Friendly } },
        { id: evacuees, relations: { [playerFactionId]: RelationshipType.Friendly, [grid]: RelationshipType.Hostile } },
        // The grid's targeting only knows what's launching from the station. It never fires at the crew, though the crew can fire at it.
        { id: grid },
    ];

    private readonly shuttles: Shuttle[] = Array.from({ length: shuttleCount }, (_, index) => ({ index, lane: null, ship: null, status: 'waiting' as const }));
    private readonly fragments = this.track<AiShip>();
    /** The fragments whose guns still work. */
    private readonly liveFragments = new Set<AiShip>();
    private fragmentsSpawned = 0;
    private lastLane: Lane | null = null;
    /** The calls and launches still to come, which an answer to the station's question replaces. */
    private schedule: EncounterTimer[] = [];
    /** Elite: whether the shuttles still to launch go out with their shields down. */
    private launchingCold = false;
    /** Game time at which the encounter started, which the schedule is counted from. */
    private startTime = 0;

    /** How many shuttles have reached the end of their lanes. */
    get saved(): number {
        return this.shuttles.filter(shuttle => shuttle.status === 'saved').length;
    }

    /** How many shuttles have been destroyed, or never launched. */
    get lost(): number {
        return this.shuttles.filter(shuttle => shuttle.status === 'lost').length;
    }

    /** Whether a fragment's gun still works. */
    isLive(fragment: AiShip): boolean {
        return this.liveFragments.has(fragment);
    }

    /** Where each lane starts and ends. */
    getLane(lane: Lane): { start: Vector2D; end: Vector2D; bearing: number } {
        const start = this.stationPosition;
        const bearing = lane.turn;
        return { start, end: { x: start.x + Math.cos(bearing) * laneLength, y: start.y - Math.sin(bearing) * laneLength }, bearing };
    }

    private get stationPosition(): Vector2D {
        // Port is towards negative y.
        return { x: 0, y: -stationOffset };
    }

    override start(): void {
        super.start();
        this.startTime = this.state.currentTime;

        this.hail(station, briefing);
        this.keepInHand('engineer', 'extendShields');

        for (let index = 0; index < shuttleCount; index++) {
            this.scheduleLaunch([index], firstLaunchMs + index * launchIntervalMs);
        }

        if (this.node.elite) {
            this.after(firstLaunchMs + 2 * launchIntervalMs + questionDelayMs, () => this.askToLaunchCold());
            this.after(reactorFailsAtMs, () => this.reactorFails());
        } else {
            this.after(firstLaunchMs + 3 * launchIntervalMs + questionDelayMs, () => this.askToSendBoth());
        }
    }

    protected populate(): void {
        // The player ships start at the origin facing along the x axis, with starboard towards positive y. The station is to port.
        this.spawnShips(corrie, [{
            design: 'miningStation',
            scenarioId: stationScenarioId,
            name: station,
            position: { ...this.stationPosition, angle: 0 },
        }]);
    }

    protected override tick(): void {
        if (this.isComplete) {
            return;
        }

        for (const shuttle of this.shuttles) {
            if (shuttle.status === 'flying' && shuttle.ship?.ai.commander.isRouteComplete) {
                this.shuttleSaved(shuttle, shuttle.ship);
            }
        }

        // A dead fragment that has drifted across its lane and out the other side has gone.
        for (const fragment of this.fragments) {
            if (!this.liveFragments.has(fragment) && fragment.ai.commander.isRouteComplete) {
                fragment.depart();
            }
        }

        this.checkAllAccountedFor();
    }

    protected override onObjectRemoved(object: GameObject, reason: RemovalReason): void {
        this.liveFragments.delete(object as AiShip);

        const shuttle = this.shuttles.find(candidate => candidate.ship === object);
        if (!shuttle || shuttle.status !== 'flying' || reason !== 'destroyed' || this.isComplete) {
            return;
        }

        shuttle.status = 'lost';
        if (!this.checkAllAccountedFor()) {
            this.hail(station, `We've lost ${numberName(shuttle.index)}.`);
        }
    }

    /**
     * Has the station call the launch of these shuttles, and launch them, so long after the start. Each goes down a different lane, none the same as the last.
     * A launch that's due sooner than it can be called is called straight away.
     */
    private scheduleLaunch(indexes: number[], atMs: number): void {
        const due = this.startTime + atMs - this.state.currentTime;
        const callIn = Math.max(0, due - launchWarningMs);
        const launchIn = Math.max(0, due);

        this.schedule.push(
            this.after(callIn, () => this.callLaunch(indexes)),
            this.after(launchIn, () => this.launch(indexes))
        );
    }

    /** Cancels whatever's still to be called or launched. */
    private clearSchedule(): void {
        for (const timer of this.schedule) {
            timer.cancel();
        }
        this.schedule = [];
    }

    /** The station calls a launch, and its lane. It's no use late, so it's urgent, and dropped if it can't be said in time. */
    private callLaunch(indexes: number[]): void {
        const waiting = indexes.map(index => this.shuttles[index]).filter(shuttle => shuttle.status === 'waiting');
        if (waiting.length === 0) {
            return;
        }

        for (const shuttle of waiting) {
            shuttle.lane = this.pickLane();
        }

        const text = waiting.length === 1
            ? `Shuttle ${numberName(waiting[0].index)}, ${waiting[0].lane!.name} lane, in five.`
            : `Shuttles ${waiting.map(shuttle => numberName(shuttle.index)).join(' and ')}, ${waiting.map(shuttle => shuttle.lane!.name).join(' and ')} lanes, in five.`;

        this.hail(station, text, { urgent: true, maxDelayMs: launchCallMaxDelayMs });
    }

    /** A lane other than the last one used. */
    private pickLane(): Lane {
        const choices = lanes.filter(lane => lane !== this.lastLane);
        const lane = this.state.random.pick(choices);
        this.lastLane = lane;
        return lane;
    }

    /** These shuttles launch, each down its lane, and the fragments that come with each arrive. */
    private launch(indexes: number[]): void {
        for (const index of indexes) {
            const shuttle = this.shuttles[index];
            if (shuttle.status !== 'waiting') {
                continue;
            }

            shuttle.lane ??= this.pickLane();
            this.launchShuttle(shuttle, shuttle.lane);
            this.spawnFragments(shuttle, shuttle.lane);
        }
    }

    private launchShuttle(shuttle: Shuttle, lane: Lane): void {
        const { start, end, bearing } = this.getLane(lane);

        const [ship] = this.spawnShips(evacuees, [{
            design: 'shuttle',
            name: `Shuttle ${numberName(shuttle.index)}`,
            position: { ...start, angle: bearing },
            goal: { type: 'travel-route', waypoints: [end], arrivalRadius },
            skill: shuttleSkill,
        }]);

        if (this.launchingCold) {
            (ship.engineerState.systems.find(tile => tile.system === 'hull') as HullSystemTile).setShield(0);
        }

        shuttle.ship = ship;
        shuttle.status = 'flying';
    }

    /**
     * The fragments that come with a shuttle arrive, on either side of its lane. The live ones go for that shuttle, and then whichever is nearest.
     * The dead ones drift across the lane and out the other side, and never load their guns.
     */
    private spawnFragments(shuttle: Shuttle, lane: Lane): void {
        const random = this.state.random;
        const { start, bearing } = this.getLane(lane);
        const middle = { x: start.x + Math.cos(bearing) * laneLength / 2, y: start.y - Math.sin(bearing) * laneLength / 2 };
        const count = fragmentWaves[shuttle.index];

        // Which of them are live.
        const order = Array.from({ length: count }, (_, index) => index);
        random.shuffle(order);
        const live = new Set(order.slice(0, liveInWave[shuttle.index]));

        for (let index = 0; index < count; index++) {
            const side = index % 2 === 0 ? 1 : -1;
            const from = bearing + side * Math.PI / 2 + random.getFloat(-fragmentSpread, fragmentSpread);
            const position = { x: middle.x + Math.cos(from) * fragmentSpawnDistance, y: middle.y - Math.sin(from) * fragmentSpawnDistance };

            // Where it crosses the lane, and where it goes from there.
            const along = random.getFloat(-crossingSpread, crossingSpread);
            const crossing = { x: middle.x + Math.cos(bearing) * along, y: middle.y - Math.sin(bearing) * along };
            const dx = crossing.x - position.x;
            const dy = crossing.y - position.y;
            const heading = -Math.atan2(dy, dx);
            // It wanders a little either side of a straight line, a leg at a time, so no two drift alike.
            const waypoints = [0.35, 0.7, 1, 1.5, 2].map((share) => {
                const wander = share === 1 ? 0 : random.getFloat(-driftWander, driftWander);
                return { x: position.x + dx * share - Math.sin(heading) * wander, y: position.y + dy * share - Math.cos(heading) * wander };
            });

            const name = `Fragment ${numberName(this.fragmentsSpawned++)}`;
            const isLive = live.has(index);

            const [fragment] = this.spawnShips(grid, [isLive
                ? { design: 'gridFragment', name, position: { ...position, angle: heading }, goal: { type: 'search-and-destroy', prefer: shuttle.ship!.id }, skill: fragmentSkill }
                : { design: 'gridFragment', name, position: { ...position, angle: heading }, goal: { type: 'travel-route', waypoints, arrivalRadius }, skill: fragmentSkill, priorities: { tactical: 0 } },
            ]);

            this.fragments.add(fragment);
            if (isLive) {
                this.liveFragments.add(fragment);
            }
        }
    }

    private shuttleSaved(shuttle: Shuttle, ship: AiShip): void {
        shuttle.status = 'saved';
        ship.depart();

        if (!this.checkAllAccountedFor()) {
            this.hail(station, `${numberName(shuttle.index)}'s away.`);
        }
    }

    /** Once every shuttle is saved or lost, it's over, graded by how many were saved. Returns whether it is. */
    private checkAllAccountedFor(): boolean {
        if (this.isComplete) {
            return true;
        }

        if (this.shuttles.some(shuttle => shuttle.status === 'waiting' || shuttle.status === 'flying')) {
            return false;
        }

        const saved = this.saved;
        this.clearSchedule();

        if (saved === 0) {
            this.complete('failure');
            this.silence();
        } else if (saved === shuttleCount) {
            this.complete('success');
            this.hail(station, 'All six. Every one of them. Now go, before she blows.');
        } else {
            this.complete('success', saved / shuttleCount);
            this.hail(station, `${numberName(saved - 1)} away. That's ${numberName(saved - 1).toLowerCase()} more than we'd have managed. Go.`);
        }

        return true;
    }

    /** The station offers to send the last two together, straight away. Saying nothing holds the schedule. */
    private askToSendBoth(): void {
        this.ask(
            station,
            'Reactor\'s ahead of us. I can send Five and Six together, right now, and we\'re all gone a minute sooner. Or I hold the schedule. Your call.',
            [
                { id: scheduleAnswers.sendBoth, label: 'Send both', onChosen: () => this.sendBoth() },
                { id: scheduleAnswers.hold, label: 'Hold the schedule', onChosen: () => {} },
            ],
            { timeoutMs: questionTimeoutMs, defaultAnswer: scheduleAnswers.hold }
        );
    }

    /** The last two launch together, shortly, down different lanes. */
    private sendBoth(): void {
        this.clearSchedule();
        const waiting = this.shuttles.filter(shuttle => shuttle.status === 'waiting').map(shuttle => shuttle.index);
        this.scheduleLaunch(waiting, this.state.currentTime - this.startTime + sendBothDelayMs);
    }

    /** Elite: the station offers to launch the rest cold, faster than the schedule. Saying nothing keeps the checks. */
    private askToLaunchCold(): void {
        this.ask(
            station,
            'She won\'t last the schedule. I can skip the checks and launch every twenty-five seconds. They\'d go out with their shields cold.',
            [
                { id: coldAnswers.cold, label: 'Launch them cold', onChosen: () => this.launchCold() },
                { id: coldAnswers.keepChecks, label: 'Keep the checks', onChosen: () => {} },
            ],
            { timeoutMs: questionTimeoutMs, defaultAnswer: coldAnswers.keepChecks }
        );
    }

    /** Elite: the rest launch every 25 seconds from the last launch, with their shields down. */
    private launchCold(): void {
        this.clearSchedule();
        this.launchingCold = true;

        const lastLaunch = firstLaunchMs + 2 * launchIntervalMs;
        const waiting = this.shuttles.filter(shuttle => shuttle.status === 'waiting');
        waiting.forEach((shuttle, order) => this.scheduleLaunch([shuttle.index], lastLaunch + (order + 1) * coldLaunchIntervalMs));
    }

    /** Elite: the station's reactor fails, and whatever hasn't launched never will. */
    private reactorFails(): void {
        this.clearSchedule();

        const stranded = this.shuttles.filter(shuttle => shuttle.status === 'waiting');
        for (const shuttle of stranded) {
            shuttle.status = 'lost';
        }

        if (stranded.length > 0 && !this.checkAllAccountedFor()) {
            this.hail(station, `Reactor's gone. ${stranded.map(shuttle => numberName(shuttle.index)).join(' and ')} won't be launching.`, { urgent: true });
        }
    }
}

export const lastShuttleOutDefinition: EncounterDefinition = {
    id: 'lastShuttleOut',
    name: 'Last Shuttle Out',
    kind: 'combat',
    objective: { type: 'protect', subject: 'the shuttles' },
    defaultEnvironment: 'asteroidField',
    request: {
        from: station,
        subject: 'evacuation cover',
        text: 'Reactor\'s going, and the old defence grid is coming apart around us. Six shuttles, one every forty seconds. We can launch them. We can\'t cover them.',
    },
    create: (state, node) => new LastShuttleOutEncounter(state, node),
};
