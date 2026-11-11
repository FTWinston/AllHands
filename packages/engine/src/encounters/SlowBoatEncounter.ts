import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { clampAngle, determineAngle, distance } from 'common-data/features/space/utils/vectors';
import { hostileToPlayer, playerFactionId } from '../campaign/factions';
import { Encounter, type EncounterTimer } from './Encounter';

import type { EncounterDefinition } from './EncounterDefinition';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { AiShip } from 'src/state/AiShip';
import type { GameObject } from 'src/state/GameObject';
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
/** A turn warning that can't be said within this long isn't said at all, as there'd be too little warning left for it to be any use. */
const turnHailMaxDelayMs = 3000;
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

const strandedLead = 'Stranded Lead';
/** How long into an elite encounter the harriers' leader makes its offer, and how long there is to answer it. */
export const offerAtMs = 60_000;
export const offerTimeoutMs = 20_000;
/** The answers that can be given to the offer. */
export const offerAnswers = { handOver: 'handOver', refuse: 'refuse' } as const;
/** How much of the usual reward a crossing is worth, if it was bought with a share of the clinic ship's stores. */
export const boughtCrossingScore = 0.5;

const numberNames = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

/**
 * A clinic ship has to be seen across to its jump point, while harriers keep coming for what it's carrying.
 * - It flies its own route, in three legs, and says which way it's turning shortly before each turn. It shoots at whatever's nearest, and says which that is.
 * - Harriers go for it, not for the player ships. Each flees once it's damaged enough, as harriers do, and another arrives every so often.
 * - The engineer always has an Extend Shields card to play, which only covers the clinic ship while helm keeps close to it.
 * - It's a success once the clinic ship reaches the end of its route, and a failure if it's destroyed. Either way the harriers then leave.
 *
 * How the clinic ship is doing is only ever said, as its shields fall, or found by scanning it: nothing shows it.
 *
 * Elite: a minute in, the harriers' leader offers to leave for a third of the clinic ship's stores. Neither answer is the right one.
 */
export class SlowBoatEncounter extends Encounter {
    protected override readonly factions = [
        { id: clinic, relations: { [playerFactionId]: RelationshipType.Friendly, [stranded]: RelationshipType.Hostile } },
        hostileToPlayer(stranded),
    ];

    private marrow: AiShip | undefined;
    private readonly harriers = this.track<AiShip>();
    /** Where Marrow starts from, and the points it turns at, the last being its jump point. */
    private routeStart: Vector2D = { x: 0, y: 0 };
    private waypoints: Vector2D[] = [];
    private harriersSpawned = 0;
    private harrierArrivals: EncounterTimer | undefined;
    /** Whether Marrow has reached the end of its route, so its removal isn't a loss. */
    private arrived = false;

    /** The most harriers that can be here at once. */
    private mostHarriers = maxHarriers;
    /** How much of the usual reward getting Marrow across is worth. */
    private crossingScore = 1;

    /** How many of Marrow's turns have been announced. */
    private turnsAnnounced = 0;
    /** How many of `shieldLines` have been said. */
    private shieldLinesSaid = 0;
    private announcedTargetId: string | null = null;
    private nextTargetHailTime = 0;
    private fleeAnnounced = false;

    override start(): void {
        super.start();

        this.hail(marrowName, openingLine);

        this.keepInHand('engineer', 'extendShields');
        this.harrierArrivals = this.every(harrierIntervalMs, () => this.harrierArrives());

        if (this.node.elite) {
            this.after(offerAtMs, () => this.makeOffer());
        }
    }

    protected populate(): void {
        // The player ships start at the origin facing along the x axis, with starboard towards positive y.
        const start = { x: 0, y: marrowOffset };
        const [first, second, third] = legLengths;
        const turn = { x: start.x + first, y: start.y };
        const turnBack = { x: turn.x + Math.cos(dogLegAngle) * second, y: turn.y - Math.sin(dogLegAngle) * second };
        this.routeStart = start;
        this.waypoints = [turn, turnBack, { x: turnBack.x + third, y: turnBack.y }];

        [this.marrow] = this.spawnShips(clinic, [{
            design: 'clinicShip',
            scenarioId: marrowScenarioId,
            name: marrowName,
            position: { ...start, angle: 0 },
            goal: { type: 'travel-route', waypoints: this.waypoints, arrivalRadius },
            skill: marrowSkill,
        }]);

        // The first two come up from astern, one on each quarter.
        this.spawnHarrier(Math.PI * 0.75);
        this.spawnHarrier(-Math.PI * 0.75);
    }

    protected override tick(): void {
        const marrow = this.marrow;
        if (this.isComplete || !marrow) {
            return;
        }

        if (marrow.ai.commander.isRouteComplete) {
            this.arrive(marrow);
            return;
        }

        const now = this.state.currentTime;

        this.announceTurn(marrow, now);
        this.announceShields(marrow);
        this.announceFleeing();
        this.announceTarget(marrow, now);
    }

    /** The harriers' leader offers to leave for a share of what the clinic ship is carrying. Saying nothing is taken as a no. */
    private makeOffer(): void {
        this.ask(
            strandedLead,
            'There\'s two hundred of us on a dead hauler, and that ship\'s carrying antibiotics. A third of the stores and we\'re gone. Your call.',
            [
                { id: offerAnswers.handOver, label: 'Hand it over', onChosen: () => this.handOverStores() },
                { id: offerAnswers.refuse, label: 'Refuse', onChosen: () => this.refuseOffer() },
            ],
            { timeoutMs: offerTimeoutMs, defaultAnswer: offerAnswers.refuse }
        );
    }

    /** Handing the stores over ends the fighting: every harrier leaves, no more come, and the crossing is worth less for having been bought. */
    private handOverStores(): void {
        this.harrierArrivals?.cancel();
        this.crossingScore = boughtCrossingScore;
        this.sendHarriersAway();
        this.hail(strandedLead, 'That\'ll keep us alive. We\'re gone.');
    }

    /** Refusing brings another harrier straight away, and lets one more than before be here at once. */
    private refuseOffer(): void {
        this.mostHarriers = maxHarriers + 1;
        this.spawnHarrier(this.state.random.getFloat(0, Math.PI * 2));
        this.hail(strandedLead, 'Then we\'ll take all of it.');
    }

    protected override onObjectRemoved(object: GameObject, reason: RemovalReason): void {
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
        this.complete('success', this.crossingScore);
        this.hail(marrowName, 'Jump point. Forty patients say thank you, and so do I.', { urgent: true });
    }

    private sendHarriersAway(): void {
        for (const harrier of this.harriers) {
            harrier.ai.commander.withdraw();
        }
    }

    /** Another harrier arrives, if there's room for one. */
    private harrierArrives(): void {
        if (this.harriers.size < this.mostHarriers) {
            this.spawnHarrier(this.state.random.getFloat(0, Math.PI * 2));
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

        const [harrier] = this.spawnShips(stranded, [{
            design: 'harrier',
            name: `Harrier ${numberNames[this.harriersSpawned] ?? this.harriersSpawned + 1}`,
            position,
            goal: { type: 'search-and-destroy', prefer: marrowScenarioId },
            skill: harrierSkill,
        }]);

        this.harriersSpawned++;
        this.harriers.add(harrier);
    }

    /**
     * Marrow says which harrier it's shooting at, whenever that changes, so the crew knows to take the others.
     * That's only worth saying straight away, so it waits for a gap in what's being said, rather than queueing.
     */
    private announceTarget(marrow: AiShip, now: number): void {
        const { targetId } = marrow.ai.blackboard;
        if (targetId === null || targetId === this.announcedTargetId || now < this.nextTargetHailTime || this.isHailing) {
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

    /** Marrow says which way it's about to turn, a little before it gets to each waypoint but the last. It's no use late, so it's urgent. */
    private announceTurn(marrow: AiShip, now: number): void {
        const index = marrow.ai.commander.waypointsReached;
        if (index !== this.turnsAnnounced || index >= this.waypoints.length - 1) {
            return;
        }

        const waypoint = this.waypoints[index];
        if (distance(marrow.getPosition(now + turnWarningMs), waypoint) > arrivalRadius) {
            return;
        }

        const from = index === 0 ? this.routeStart : this.waypoints[index - 1];
        const turn = clampAngle(determineAngle(waypoint, this.waypoints[index + 1]) - determineAngle(from, waypoint));

        this.turnsAnnounced++;
        this.hail(marrowName, `Coming about to ${turn > 0 ? 'port' : 'starboard'} in five.`, { urgent: true, maxDelayMs: turnHailMaxDelayMs });
    }
}

export const slowBoatDefinition: EncounterDefinition = {
    id: 'slowBoat',
    name: 'Slow Boat',
    kind: 'combat',
    objective: { type: 'protect', subject: 'Marrow' },
    defaultEnvironment: 'asteroidField',
    request: { from: marrowName, subject: 'escort request', text: 'Full ward, forty beds. We\'re crossing the Shallows drift and something\'s been shadowing us since the last beacon.' },
    create: (state, node) => new SlowBoatEncounter(state, node),
};
