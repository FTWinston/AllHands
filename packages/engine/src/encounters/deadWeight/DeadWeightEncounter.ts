import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { distance } from 'common-data/features/space/utils/vectors';
import { hostileToPlayer, playerFactionId } from 'src/campaign/factions';
import { Encounter } from '../Encounter';
import { TowLink } from './TowLink';
import type { EncounterDefinition } from '../EncounterDefinition';
import type { Damage } from 'common-data/features/space/types/Damage';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { AiShip } from 'src/state/AiShip';
import type { GameObject } from 'src/state/GameObject';
import type { RemovalReason } from 'src/types/RemovalReason';

const receivership = 'receivership';
const ring = 'ring';

/** The scenario ids of the tug and what it's towing. */
export const tugScenarioId = 'tug';
export const moduleScenarioId = 'waterModule';
const tugName = 'Tug Lien';
const moduleName = 'Water Module';
const bailiffNames = ['Bailiff One', 'Bailiff Two'] as const;
const halden = 'Halden Ring';
const skill = 0.7;

/** How far ahead of the player ships the tug starts, facing away from them. */
export const tugDistance = 10;
/** How far behind the tug the module rides on its line. */
export const towLength = 2.5;
/**
 * How far the tug has to tow the module to get away with it. It flies there on one Slow and Steady, which starts and ends slowly:
 * it covers the first 5 units in about 20 seconds, then reaches 1 unit a second, the crew's best speed, about halfway.
 */
export const towDistance = 130;
/** How close to the end of its route the tug has to be to have reached it. */
const arrivalRadius = 2;
/** How far to either side of the tug its bailiffs start. */
const bailiffOffset = 3;

/** How much of a torpedo that hits the tug also hits the module, while the line is attached. */
export const torpedoSpill = 0.5;
/** How long after its engines are put out the tug cuts the line, and how long after that it jumps away. */
export const lineCutDelayMs = 3000;
export const tugJumpDelayMs = 5000;
/** Elite: how often the module's failing coolant costs it a hull card, while nothing is powering it. */
export const coolantIntervalMs = 8000;

/** What Halden Ring says as the tug gets a third and two thirds of the way to the end of its route, worst last. */
const progressLines: readonly (readonly [fraction: number, line: string])[] = [
    [1 / 3, 'They\'re a third of the way to the marker.'],
    [2 / 3, 'Two thirds. Past the marker we can\'t follow.'],
];

const briefing = 'That\'s our water on that line. Its engines are the weak point: put those out and it has to let go. Don\'t sink it while it\'s holding on. And no torpedoes on the tug. What hits it hits the module.';
const eliteBriefing = `${briefing} Her coolant's going too. If you can spare her power, she'll hold.`;

/**
 * A Receivership tug is towing away a station's water module, with two bailiffs guarding it. The module has to be got back in one piece.
 * - The tug flies straight for a marker, and the module rides a line behind it. Halden Ring says when it's a third and two thirds of the way.
 * - Putting its engines out (every helm card damaged) stops it where it is, and it cuts the line a few seconds later. Nothing aboard repairs anything.
 * - Driving both bailiffs off does the same: the first to flee says so, and goes for good, and once both are gone the tug cuts the line and leaves.
 * - A torpedo that hits the tug while the line is attached hits the module too, for half as much.
 * - It's a success once the line is cut. It's a failure if the tug reaches the marker still towing it, if the module is destroyed,
 *   or if the tug is destroyed while it's attached, which takes the module with it.
 *
 * Elite: the module's coolant is failing, and it loses a hull card every few seconds unless the crew's engineer powers it with Transfer Power,
 * which they always have in hand.
 */
export class DeadWeightEncounter extends Encounter {
    protected override readonly factions = [
        hostileToPlayer(receivership),
        // The Receivership has no quarrel with the ring, so the bailiffs never shoot at what they're being paid to take.
        { id: ring, relations: { [playerFactionId]: RelationshipType.Friendly } },
    ];

    private tug: AiShip | undefined;
    private module: AiShip | undefined;
    private readonly bailiffs = this.track<AiShip>();
    private line: TowLink | undefined;
    private routeStart: Vector2D = { x: 0, y: 0 };

    /** Whether the tug's engines have been put out, so it's stopped and about to cut the line. */
    private enginesOut = false;
    /** Whether the module is leaving with the tug, so its removal isn't a loss. */
    private towedAway = false;
    /** Game time at which the tug jumps away, once it's let go of the module and can't fly itself out. */
    private tugLeavesAt: number | null = null;

    private progressLinesSaid = 0;
    private fleeAnnounced = false;
    private torpedoAnnounced = false;

    /** Whether the line from the tug to the module is still attached. */
    get isTowing(): boolean {
        return this.line?.isAttached ?? false;
    }

    override start(): void {
        super.start();

        this.hail(halden, this.node.elite ? eliteBriefing : briefing);
        this.hail(tugName, 'This asset is under lawful recovery. Interference will be invoiced.');

        if (this.node.elite) {
            this.keepInHand('engineer', 'transferPower');
            this.every(coolantIntervalMs, () => this.coolantFails());
        }
    }

    protected populate(): void {
        // The player ships start at the origin facing along the x axis, with starboard towards positive y. The tug is ahead of them, going the same way.
        const tugStart = { x: tugDistance, y: 0 };
        this.routeStart = tugStart;

        const [tug, ...bailiffs] = this.spawnShips(receivership, [
            {
                design: 'tug',
                scenarioId: tugScenarioId,
                name: tugName,
                position: { ...tugStart, angle: 0 },
                goal: { type: 'travel-route', waypoints: [{ x: tugStart.x + towDistance, y: tugStart.y }], arrivalRadius },
                skill,
            },
            ...bailiffNames.map((name, index) => ({
                design: 'harrier' as const,
                name,
                position: { x: tugStart.x, y: tugStart.y + (index === 0 ? -bailiffOffset : bailiffOffset), angle: 0 },
                guards: tugScenarioId,
                skill,
            })),
        ]);

        // The module is the ring's, not the Receivership's.
        const [module] = this.spawnShips(ring, [{
            design: 'waterModule',
            scenarioId: moduleScenarioId,
            name: moduleName,
            position: { x: tugStart.x - towLength, y: tugStart.y, angle: 0 },
        }]);

        this.tug = tug;
        this.module = module;
        this.bailiffs.add(...bailiffs);
        this.line = new TowLink(tug, module, towLength);

        tug.hitReceived.addListener('deadWeight', ({ damage }) => this.tugHit(damage));
    }

    protected override tick(): void {
        const tug = this.tug;

        // The tug only jumps away once it has let go, so this happens after the outcome.
        if (tug && this.tugLeavesAt !== null && this.state.currentTime >= this.tugLeavesAt) {
            this.tugLeavesAt = null;
            tug.depart();
        }

        const line = this.line;
        if (this.isComplete || !tug || !line?.isAttached) {
            return;
        }

        line.update();

        if (this.enginesOut) {
            return;
        }

        if (tug.helmState.health <= 0) {
            this.stopTug();
            return;
        }

        if (tug.ai.commander.isRouteComplete) {
            this.towAway(tug);
            return;
        }

        this.announceFleeing();
        if (this.bailiffs.all.every(bailiff => bailiff.ai.commander.isWithdrawing)) {
            this.escortGone(tug);
            return;
        }

        this.announceProgress(tug);
    }

    protected override onObjectRemoved(object: GameObject, reason: RemovalReason): void {
        if (this.isComplete) {
            return;
        }

        if (object === this.tug && reason === 'destroyed' && this.isTowing) {
            // Whatever destroys the tug destroys what it's holding on to.
            this.line?.release(this.state.currentTime);
            this.module?.destroy();
        } else if (object === this.module && !this.towedAway) {
            this.moduleLost();
        }
    }

    /** A torpedo that hits the tug while it's towing hits the module too. */
    private tugHit(damage: Damage): void {
        const module = this.module;
        if (this.isComplete || !this.isTowing || !module || !damage.traits.includes('torpedoWeapon')) {
            return;
        }

        module.damage({ amount: Math.round(damage.amount * torpedoSpill), traits: [], targetSystem: 'hull', sourceId: damage.sourceId });

        if (!this.torpedoAnnounced && !this.isComplete) {
            this.torpedoAnnounced = true;
            this.hail(halden, 'That hit the module! No more torpedoes!', { urgent: true });
        }
    }

    /** Its engines are out, so it has stopped where it is (as any ship does), and it lets go a few seconds later. */
    private stopTug(): void {
        this.enginesOut = true;

        this.hail(tugName, 'Drive\'s dead. Fine. Keep it. Cutting the line.', { urgent: true });

        this.after(lineCutDelayMs, () => {
            this.tugLeavesAt = this.state.currentTime + tugJumpDelayMs;
            this.lineCut();
        });
    }

    /** Both bailiffs are gone, and the tug won't stay on its own. */
    private escortGone(tug: AiShip): void {
        tug.ai.commander.withdraw();
        this.hail(tugName, 'Escort\'s gone. Not worth the invoice. Cutting the line.', { urgent: true });
        this.lineCut();
    }

    /** The tug lets go of the module, and the bailiffs leave. */
    private lineCut(): void {
        this.line?.release(this.state.currentTime);
        this.sendBailiffsAway();
        this.complete('success');
        this.hail(halden, 'Line\'s parted. Our own tugs are on the way. Nine hundred people say thank you.');
    }

    /** The tug reaches the marker with the module still on its line, and jumps away with it. */
    private towAway(tug: AiShip): void {
        this.towedAway = true;
        this.sendBailiffsAway();
        tug.depart();
        this.module?.depart();
        this.complete('failure');
        this.silence();
        this.hail(tugName, 'Asset recovered. Good day.');
    }

    /** The module is destroyed: there's nothing left to take, or to save. */
    private moduleLost(): void {
        this.line?.release(this.state.currentTime);
        this.tug?.ai.commander.withdraw();
        this.sendBailiffsAway();
        this.complete('failure');
        this.silence();
        this.hail(halden, '...That was the water.');
    }

    private sendBailiffsAway(): void {
        for (const bailiff of this.bailiffs) {
            bailiff.ai.commander.withdraw();
        }
    }

    /** A bailiff that's damaged enough to flee isn't coming back: it leaves for good, and the first to go says so. */
    private announceFleeing(): void {
        for (const bailiff of this.bailiffs) {
            if (bailiff.ai.blackboard.goal !== 'flee' || bailiff.ai.commander.isWithdrawing) {
                continue;
            }

            bailiff.ai.commander.withdraw();

            if (!this.fleeAnnounced) {
                this.fleeAnnounced = true;
                this.hail(bailiff.name, 'This wasn\'t in the contract. Out.');
            }
        }
    }

    /** Halden Ring says how far the tug has got, as nothing shows it. Only the furthest, if it got past both at once. */
    private announceProgress(tug: AiShip): void {
        const travelled = distance(tug.getPosition(this.state.currentTime), this.routeStart) / towDistance;
        let line: string | undefined;

        while (this.progressLinesSaid < progressLines.length && travelled >= progressLines[this.progressLinesSaid][0]) {
            line = progressLines[this.progressLinesSaid][1];
            this.progressLinesSaid++;
        }

        if (line) {
            this.hail(halden, line);
        }
    }

    /** Elite: the module loses some of its hull to its failing coolant, unless something is powering it. */
    private coolantFails(): void {
        const module = this.module;
        if (!module || !this.state.objects.has(module.id) || this.isModulePowered(module)) {
            return;
        }

        module.hullState.adjustHealth(-1);
    }

    private isModulePowered(module: AiShip): boolean {
        return module.engineerState.systems.some(tile => tile.system === 'hull' && tile.hasEffect('powerReceived'));
    }
}

export const deadWeightDefinition: EncounterDefinition = {
    id: 'deadWeight',
    name: 'Dead Weight',
    kind: 'combat',
    objective: { type: 'recover', subject: 'the water module' },
    defaultEnvironment: 'gasGiant',
    request: {
        from: halden,
        subject: 'repossession',
        text: 'A Receivership tug has our water plant on a line, and it\'s leaving. That module is nine hundred people\'s water. Stop the tug. Don\'t stop the module.',
    },
    create: (state, node) => new DeadWeightEncounter(state, node),
};
