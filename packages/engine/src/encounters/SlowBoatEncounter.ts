import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { getHailDuration } from 'common-data/features/sectors/types/HailInfo';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { clampAngle, determineAngle, distance } from 'common-data/features/space/utils/vectors';
import { CardState } from 'src/state/CardState';
import { getPlayerShips } from 'src/utils/shipQueries';
import { hostileToPlayer, playerFactionId } from '../campaign/factions';
import { spawnEnemies } from './CombatEncounter';
import { Encounter } from './Encounter';
import type { SectorNodeInfo } from 'common-data/features/sectors/types/SectorNodeInfo';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { AiShip } from 'src/state/AiShip';
import type { GameObject } from 'src/state/GameObject';
import type { GameState } from 'src/state/GameState';
import type { RemovalReason } from 'src/types/RemovalReason';

const clinic = 'clinic';
const stranded = 'stranded';

/** The scenario id of the ship being escorted, which the harriers prefer to anything else. */
export const marrowScenarioId = 'marrow';
const marrowName = 'Clinic Ship Marrow';
/** Full marks, so it holds a steady course, and doesn't keep changing its mind about what to shoot at. */
const marrowSkill = 1;
const harrierSkill = 0.6;

/** Marrow starts this far to starboard of the player ships, on the same heading. */
const marrowOffset = 4;
/** How far Marrow flies on each leg of its crossing. It turns to port after the first, and back to starboard after the second. */
const legLengths = [60, 40, 60] as const;
/** How far Marrow turns off its heading for the middle leg. */
const dogLegAngle = Math.PI / 4;
/** How close Marrow has to get to each waypoint to have reached it. */
const arrivalRadius = 2;

/** How far from Marrow each harrier arrives. */
const harrierSpawnDistance = 12;
/** How often another harrier arrives, while there are fewer than `maxHarriers`. */
export const harrierIntervalMs = 40_000;
export const maxHarriers = 3;

/** How long before Marrow reaches a waypoint it says which way it's about to turn. */
export const turnWarningMs = 5000;
/** Marrow says which harrier it's shooting at no more often than this. */
const targetHailIntervalMs = 10_000;

const openingLine = 'Glad of the company. We\'ll hold a steady course and keep our one gun busy. Stay close: our shields weren\'t built for this.';

/**
 * What Marrow says as its shields fall to each fraction of their capacity, worst last.
 * It's the shields that matter: there's so little under them that the first hit to get through is likely to be the last.
 */
const shieldLines: readonly (readonly [fraction: number, line: string])[] = [
    [0.75, 'Taking hits. Shields are holding.'],
    [0.5, 'Shields at half. We\'re moving patients out of the outer wards.'],
    [0.25, 'Shields are almost gone. We can\'t take much more of this.'],
];

const numberNames = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

/**
 * A clinic ship has to be seen across to its jump point, while harriers keep coming for what it's carrying.
 * - It flies its own route, in three legs, and says which way it's turning shortly before each turn. It shoots at whatever's nearest, and says which that is.
 * - Harriers go for it, not for the player ships. Each flees once it's damaged enough, as harriers do, and another arrives every so often.
 * - The engineer always has an Extend Shields card to play, which only covers the clinic ship while helm keeps close to it.
 * - It's a success once the clinic ship reaches the end of its route, and a failure if it's destroyed. Either way the harriers then leave.
 *
 * How the clinic ship is doing is only ever said, as its shields fall, or found by scanning it: nothing shows it.
 */
export class SlowBoatEncounter extends Encounter {
    protected override readonly sides = [
        { id: clinic, relations: { [playerFactionId]: RelationshipType.Friendly, [stranded]: RelationshipType.Hostile } },
        hostileToPlayer(stranded),
    ];

    private marrow: AiShip | undefined;
    private harriers: AiShip[] = [];
    private waypoints: Vector2D[] = [];
    private startTime = 0;
    private harriersSpawned = 0;
    private nextHarrierTime = 0;
    /** Whether Marrow has reached the end of its route, so its removal isn't a loss. */
    private arrived = false;

    /** How many of Marrow's turns have been announced. */
    private turnsAnnounced = 0;
    /** How many of `shieldLines` have been said. */
    private shieldLinesSaid = 0;
    private announcedTargetId: string | null = null;
    private nextTargetHailTime = 0;
    private fleeAnnounced = false;

    constructor(state: GameState, node: SectorNodeInfo) {
        super(state, { ...node, objective: { type: 'protect', subject: 'Marrow' } });
    }

    override start(): void {
        super.start();

        const now = this.state.currentTime;
        this.startTime = now;
        this.nextHarrierTime = now + harrierIntervalMs;
        // Nothing else is said until there's been time to read the opening line.
        this.nextTargetHailTime = now + getHailDuration(openingLine);
        this.hail(marrowName, openingLine);

        this.dealExtendShields();
    }

    /**
     * Each engineer holds an Extend Shields card for as long as the encounter runs, whenever their shields aren't already extended.
     * It's used up when played, and dealt again once its effect has run out, so it never joins the deck, and can't be played twice over.
     * Whatever's left goes when hands are cleared at the end of the encounter.
     */
    private dealExtendShields(): void {
        for (const ship of getPlayerShips(this.state)) {
            if (ship.hasExtendedShields || ship.engineerState.hand.some(card => card.type === 'extendShields')) {
                continue;
            }

            const card = new CardState(ship.getCardId(), 'extendShields');
            card.addTrait('expendable', ExtraTraitType.Normal);
            ship.engineerState.addCardToHand(card);
        }
    }

    protected populate(): void {
        // The player ships start at the origin facing along the x axis, with starboard towards positive y.
        const start = { x: 0, y: marrowOffset };
        const [first, second, third] = legLengths;
        const turn = { x: start.x + first, y: start.y };
        const turnBack = { x: turn.x + Math.cos(dogLegAngle) * second, y: turn.y - Math.sin(dogLegAngle) * second };
        this.waypoints = [turn, turnBack, { x: turnBack.x + third, y: turnBack.y }];

        const [marrow] = spawnEnemies(this.state, clinic, [{
            design: 'clinicShip',
            scenarioId: marrowScenarioId,
            name: marrowName,
            position: { ...start, angle: 0 },
            goal: { type: 'travel-route', waypoints: this.waypoints, arrivalRadius },
            skill: marrowSkill,
        }]);

        this.marrow = marrow;
        this.spawnObjects([marrow]);

        // The first two come up from astern, one on each quarter.
        this.spawnHarrier(Math.PI * 0.75);
        this.spawnHarrier(-Math.PI * 0.75);
    }

    override tick(_deltaTime: number): void {
        const marrow = this.marrow;
        if (this.isComplete || !marrow) {
            return;
        }

        if (marrow.ai.commander.isRouteComplete) {
            this.arrive(marrow);
            return;
        }

        this.dealExtendShields();

        const now = this.state.currentTime;

        this.announceTarget(marrow, now);
        this.announceFleeing();
        this.announceShields(marrow);
        this.announceTurn(marrow, now);

        if (now >= this.nextHarrierTime) {
            this.nextHarrierTime = now + harrierIntervalMs;

            if (this.harriers.length < maxHarriers) {
                this.spawnHarrier(this.state.random.getFloat(0, Math.PI * 2));
            }
        }
    }

    override onObjectRemoved(object: GameObject, reason: RemovalReason): void {
        this.harriers = this.harriers.filter(harrier => harrier !== object);

        if (object === this.marrow && !this.arrived && reason === 'destroyed') {
            // There's nothing left to take, and nothing to say.
            this.sendHarriersAway();
            this.complete('failure');
            this.silence();
        }
    }

    /** Marrow reaches its jump point, and goes. With nothing left to take, so do the harriers. */
    private arrive(marrow: AiShip): void {
        this.arrived = true;
        this.sendHarriersAway();
        marrow.depart();
        this.complete('success');
        this.hail(marrowName, 'Jump point. Forty patients say thank you, and so do I.');
    }

    private sendHarriersAway(): void {
        for (const harrier of this.harriers) {
            harrier.ai.commander.withdraw();
        }
    }

    /** Another harrier arrives, on the given bearing from Marrow, facing it. */
    private spawnHarrier(bearing: number): void {
        const marrow = this.marrow;
        if (!marrow) {
            return;
        }

        const target = marrow.getPosition(this.state.currentTime);
        const position = {
            x: target.x + Math.cos(bearing) * harrierSpawnDistance,
            y: target.y - Math.sin(bearing) * harrierSpawnDistance,
            angle: bearing + Math.PI,
        };

        const [harrier] = spawnEnemies(this.state, stranded, [{
            design: 'harrier',
            name: `Harrier ${numberNames[this.harriersSpawned] ?? this.harriersSpawned + 1}`,
            position,
            goal: { type: 'search-and-destroy', prefer: marrowScenarioId },
            skill: harrierSkill,
        }]);

        this.harriersSpawned++;
        this.harriers.push(harrier);
        this.spawnObjects([harrier]);
    }

    /** Marrow says which harrier it's shooting at, whenever that changes, so the crew knows to take the others. */
    private announceTarget(marrow: AiShip, now: number): void {
        const { targetId } = marrow.ai.blackboard;
        if (targetId === null || targetId === this.announcedTargetId || now < this.nextTargetHailTime) {
            return;
        }

        const target = this.harriers.find(harrier => harrier.id === targetId);
        if (target) {
            this.announcedTargetId = targetId;
            this.nextTargetHailTime = now + targetHailIntervalMs;
            this.hail(marrowName, `We have ${target.name}.`);
        }
    }

    /** The first harrier to give up says so, which is how the crew learns that they can be driven off. */
    private announceFleeing(): void {
        if (this.fleeAnnounced) {
            return;
        }

        const fleeing = this.harriers.find(harrier => harrier.ai.blackboard.goal === 'flee');
        if (fleeing) {
            this.fleeAnnounced = true;
            this.hail(fleeing.name, 'Not worth it. Breaking off.');
        }
    }

    /** Marrow says how it's doing as its shields fall, as nothing else tells the crew. */
    private announceShields(marrow: AiShip): void {
        const fraction = marrow.hullState.shield / marrow.hullState.maxShield;
        let line: string | undefined;

        // Only the worst of what hasn't been said yet, if they fell past several at once.
        while (this.shieldLinesSaid < shieldLines.length && fraction <= shieldLines[this.shieldLinesSaid][0]) {
            line = shieldLines[this.shieldLinesSaid][1];
            this.shieldLinesSaid++;
        }

        if (line) {
            this.hail(marrowName, line);
        }
    }

    /** Marrow says which way it's about to turn, a little before it gets to each waypoint but the last. */
    private announceTurn(marrow: AiShip, now: number): void {
        const index = marrow.ai.commander.waypointsReached;
        if (index !== this.turnsAnnounced || index >= this.waypoints.length - 1) {
            return;
        }

        const waypoint = this.waypoints[index];
        if (distance(marrow.getPosition(now + turnWarningMs), waypoint) > arrivalRadius) {
            return;
        }

        const from = index === 0 ? marrow.getPosition(this.startTime) : this.waypoints[index - 1];
        const turn = clampAngle(determineAngle(waypoint, this.waypoints[index + 1]) - determineAngle(from, waypoint));

        this.turnsAnnounced++;
        this.hail(marrowName, `Coming about to ${turn > 0 ? 'port' : 'starboard'} in five.`);
    }
}
