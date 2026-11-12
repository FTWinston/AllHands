import { isCrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { keyTurnedDuration } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { distance } from 'common-data/features/space/utils/vectors';
import { hostileToPlayer, playerFactionId } from 'src/campaign/factions';
import { getPlayerShips } from 'src/utils/shipQueries';
import { Encounter, type EncounterTimer } from './Encounter';
import type { EncounterDefinition } from './EncounterDefinition';
import type { ObjectiveInfo } from 'common-data/features/sectors/types/ObjectiveInfo';
import type { ShieldTuningEffect } from 'common-data/features/ships/utils/shieldStats';
import type { FactionConfig } from 'common-data/features/space/types/FactionConfig';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';
import type { AiShip } from 'src/state/AiShip';
import type { CardState } from 'src/state/CardState';
import type { GameObject } from 'src/state/GameObject';
import type { PlayerShip } from 'src/state/PlayerShip';
import type { RemovalReason } from 'src/types/RemovalReason';

const gate = 'gate';
const keepers = 'keepers';

const gateName = 'Quarantine Gate';
const keeperTeam = 'Keeper Team';
const boatName = 'Keeper Boat Tally';
export const boatScenarioId = 'tally';

/** What the crew is asked to do: first the gate, then, once the door's open, the keepers' boat. */
export const gateObjective: ObjectiveInfo = { type: 'disable', subject: 'the Quarantine Gate' };
export const boatObjective: ObjectiveInfo = { type: 'protect', subject: 'the keepers\' boat' };

/** How far ahead of the player ships the middle of the gate is. Its pylons are at the corners of a square this wide, so the nearest two start out of torpedo range. */
export const gateDistance = 30;
export const squareSide = 24;
const pylonSkill = 0.5;
/** How far round each pylon's own position it engages. Past every weapon's reach. */
const pylonDefendRadius = 30;

/** How often the master pylon changes its shields' tuning, at random between these, and how long the others take to copy it. That delay is the tell. */
export const modeIntervalMs = { min: 9000, max: 15_000 } as const;
export const copyDelayMs = 3000;
/** How long after a pylon that isn't the master loses its shields the gate puts them back. */
export const reseatDelayMs = 5000;

/** How long a turned key stays turned, and how close to the master a ship has to be for the gate to hear its keys. */
export const keyWindowMs = keyTurnedDuration;
export const keyRange = 8;

/** How far from the master the keepers' boat sets out, on the far side from the other pylons, how close it has to come to dock, and how long it has to stay docked. */
export const boatLaunchDistance = 30;
export const dockRadius = 2;
/** Where the boat holds once it's docked: this far out from the master. */
const dockOffset = 1.5;
export const boardingMs = 90_000;
/** How long after a boat is lost the next one sets out. */
export const secondBoatDelayMs = 10_000;
/** Full marks, so it flies straight in and doesn't change its mind. */
const boatSkill = 1;

/** How often each pylon that's still fighting launches a drone, once the door's open, and the most there can be at once. */
export const droneIntervalMs = 20_000;
export const maxDrones = 4;
/** How far to the side of its pylon a drone launches from. */
const droneSpacing = 3;

/** What the pylons' shields are tuned against, one then the other. */
const tunings: readonly ShieldTuningEffect[] = ['shieldTunedEnergy', 'shieldTunedTorpedo'];

/** What the boat says as its shields fall to each fraction of their capacity, worst last. */
const boatShieldLines: readonly (readonly [fraction: number, line: string])[] = [
    [0.5, 'Shields at half.'],
    [0.25, 'Shields nearly gone.'],
];

const numberNames = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

const briefing = 'Four pylons, one master. The other three copy its shield setting a moment late. Find the one that changes first and take its shields down. Only its shields. We need it working.';

/** Which of its three parts the encounter is in: finding the master, turning the keys, or holding the door. */
export type GatePhase = 'diagnose' | 'keys' | 'door';

/** How far along one player ship is with its keys: a turn of them that's begun, and whether the gate has already said it can't hear them. */
interface KeyAttempt {
    refused: boolean;
}

/**
 * Sector 1's boss: an old quarantine gate, four pylons at the corners of a square, which the relay keepers can lift for good, if they're got to its door.
 * - One pylon is the master. It changes its shields' tuning every so often, and the rest copy it a moment later. Each time it changes, a pulse lands
 *   on one of each player ship's crew systems, which their engineer sees. A scan of a pylon shows its tuning, so one that changes on the pulse is the master.
 * - The master's shields at 0 have the keepers put a Shutdown Key in each station's hand, and Key Power in the engineer's: a key costs a level more than
 *   any station has. Another pylon's shields at 0 are put back a moment later. The master destroyed, the gate picks another and it starts again, with one
 *   pylon fewer. The last one destroyed, the gate is open for good, at half the reward.
 * - All four of a ship's keys turned at once, close to the master, open the door. The master stands down, the other pylons launch drones, which go for
 *   the keepers' boat, and the boat flies in to dock with the master. Once it has been docked long enough, the quarantine is lifted.
 *   Each boat lost, another sets out, and docking starts again.
 *
 * There's no elite form, and no failure but losing the ship.
 */
export class QuarantineGateEncounter extends Encounter {
    protected override readonly factions: readonly FactionConfig[] = [
        hostileToPlayer(gate),
        { id: keepers, relations: { [playerFactionId]: RelationshipType.Friendly, [gate]: RelationshipType.Hostile } },
    ];

    private readonly pylonShips = this.track<AiShip>();
    /** Every pylon there was, for telling when the last of them goes. */
    private readonly everyPylon = new Set<AiShip>();
    private readonly drones = this.track<AiShip>();
    private masterShip: AiShip | null = null;
    private currentPhase: GatePhase = 'diagnose';

    /** What the master is tuned against, and what the others are, which is what the master was a moment ago. */
    private masterTuning: ShieldTuningEffect = tunings[0];
    private copyTuning: ShieldTuningEffect = tunings[0];
    private modeChange: EncounterTimer | undefined;
    private copying: EncounterTimer | undefined;
    /** Pylons whose shields the gate is about to put back. */
    private readonly reseating = new Set<AiShip>();

    /** The keys, and Key Power, that the crew is kept supplied with while the gate is listening. */
    private keyCards: CardState[] = [];
    private readonly keyAttempts = new Map<PlayerShip, KeyAttempt>();

    private boat: AiShip | null = null;
    private boatLaunch: EncounterTimer | undefined;
    private dronesLaunched = 0;
    private droneLaunches: EncounterTimer | undefined;
    private boarding: EncounterTimer | undefined;
    private halfway: EncounterTimer | undefined;
    private dockedAt: number | null = null;
    private boatShieldLinesSaid = 0;

    /** The pylons still standing, in order round the square. */
    get pylons(): readonly AiShip[] {
        return this.pylonShips.all;
    }

    /** The pylon the others copy, which the keys have to be turned close to. */
    get master(): AiShip | null {
        return this.masterShip;
    }

    get phase(): GatePhase {
        return this.currentPhase;
    }

    /** The keepers' boat that's out now, if one is. */
    get keepersBoat(): AiShip | null {
        return this.boat;
    }

    /** Game time at which the boat that's out docked, or null if it hasn't. */
    get dockedSince(): number | null {
        return this.dockedAt;
    }

    /** The drones that are out. */
    get dronesOut(): readonly AiShip[] {
        return this.drones.all;
    }

    /** What a pylon's shields are tuned against, just now. */
    tuningOf(pylon: AiShip): ShieldTuningEffect {
        return pylon === this.masterShip ? this.masterTuning : this.copyTuning;
    }

    /** Makes this pylon the master, as though the gate had picked it. For tests, and for nothing in the game. */
    makeMaster(pylon: AiShip): void {
        this.masterShip = pylon;
        this.copyTuning = this.masterTuning;
        this.applyTunings();
    }

    override start(): void {
        super.start();

        this.hail(keeperTeam, briefing);
        this.hail(gateName, 'QUARANTINE IN EFFECT. DAY TEN THOUSAND NINE HUNDRED AND FIFTY-EIGHT. TURN BACK.');

        this.scheduleModeChange();
    }

    protected populate(): void {
        const centre = this.centre;
        const half = squareSide / 2;
        // Round the square, starting from the near corner to port.
        const corners: Vector2D[] = [
            { x: centre.x - half, y: centre.y - half },
            { x: centre.x + half, y: centre.y - half },
            { x: centre.x + half, y: centre.y + half },
            { x: centre.x - half, y: centre.y + half },
        ];

        // One at a time, in order round the square, as target lists show ships in the order they were spawned. Each faces where the crew comes in.
        const pylons = corners.map((corner, index) => {
            const position = { ...corner, angle: -Math.atan2(-corner.y, -corner.x) };
            return this.spawnShips(gate, [{
                design: 'gatePylon',
                name: `Pylon ${numberNames[index]}`,
                position,
                goal: { type: 'defend-position', position, radius: pylonDefendRadius },
                skill: pylonSkill,
            }])[0];
        });

        this.pylonShips.add(...pylons);
        for (const pylon of pylons) {
            this.everyPylon.add(pylon);
        }
        this.masterShip = this.state.random.pick(pylons);
        this.applyTunings();
    }

    protected override tick(): void {
        if (this.isComplete) {
            return;
        }

        this.applyTunings();
        this.checkShields();

        if (this.currentPhase === 'keys') {
            this.followKeys();
        } else if (this.currentPhase === 'door') {
            this.followBoat();
        }
    }

    protected override onObjectRemoved(object: GameObject, reason: RemovalReason): void {
        if (this.isComplete || reason !== 'destroyed') {
            return;
        }

        if (this.everyPylon.has(object as AiShip) && this.pylonShips.size === 0) {
            this.openForGood();
        } else if (object === this.masterShip) {
            this.masterDestroyed();
        } else if (object === this.boat) {
            this.boatLost();
        }
    }

    private get centre(): Vector2D {
        return { x: gateDistance, y: 0 };
    }

    /** The gate sets every pylon's tuning, whatever its own hull cards do: an emitter played clears it, and it's back before anyone can see. */
    private applyTunings(): void {
        for (const pylon of this.pylonShips) {
            const tuning = this.tuningOf(pylon);
            const tile = pylon.engineerState.systems.find(candidate => candidate.system === 'hull');
            if (tile && (!tile.hasEffect(tuning) || tile.hasEffect('shieldReinforced') || tunings.some(other => other !== tuning && tile.hasEffect(other)))) {
                pylon.hullState.tuneShields(tuning);
            }
        }
    }

    private scheduleModeChange(): void {
        this.modeChange?.cancel();
        this.modeChange = this.after(this.state.random.getFloat(modeIntervalMs.min, modeIntervalMs.max), () => this.changeMode());
    }

    /** The master changes its tuning, a pulse lands on each player ship, and the others copy it a moment later. Only while the crew is finding it. */
    private changeMode(): void {
        if (this.currentPhase !== 'diagnose') {
            return;
        }

        const next = this.masterTuning === tunings[0] ? tunings[1] : tunings[0];
        this.masterTuning = next;
        this.applyTunings();
        this.pulse();

        this.copying = this.after(copyDelayMs, () => {
            this.copyTuning = next;
            this.applyTunings();
        });

        this.scheduleModeChange();
    }

    /** The pulse lands on one crew system of each player ship, for the engineer to see. */
    private pulse(): void {
        for (const ship of getPlayerShips(this.state)) {
            this.state.random.pick(ship.engineerState.systems.filter(tile => isCrewRoleName(tile.system))).addEffect('gatePulse');
        }
    }

    private checkShields(): void {
        for (const pylon of this.pylonShips) {
            if (pylon.hullState.shield > 0 || this.reseating.has(pylon)) {
                continue;
            }

            if (pylon !== this.masterShip) {
                this.reseat(pylon);
            } else if (this.currentPhase === 'diagnose') {
                this.masterShieldsDown();
            }
        }
    }

    /** A pylon that isn't the master has its shields put back, a moment later. The crew has spent its own finding out. */
    private reseat(pylon: AiShip): void {
        this.reseating.add(pylon);

        this.after(reseatDelayMs, () => {
            this.reseating.delete(pylon);
            if (!this.state.objects.has(pylon.id)) {
                return;
            }

            pylon.hullState.restoreShields();
            this.applyTunings();
            this.hail(gateName, `${pylon.name.toUpperCase()} RESEATED.`, { urgent: true });
            this.hail(keeperTeam, 'Wrong one. It\'s put its shields back.');
        });
    }

    /** The master's shields are down: the keepers put a key in each station's hand, and Key Power in the engineer's, to get them up to it. */
    private masterShieldsDown(): void {
        this.currentPhase = 'keys';
        this.modeChange?.cancel();
        this.copying?.cancel();

        this.keyCards = [
            ...this.keepInHand('helm', 'shutdownKeyHelm'),
            ...this.keepInHand('science', 'shutdownKeyScience'),
            ...this.keepInHand('tactical', 'shutdownKeyTactical'),
            ...this.keepInHand('engineer', 'shutdownKeyEngineer'),
            ...this.keepInHand('engineer', 'keyPower'),
        ];

        this.hail(keeperTeam, 'That\'s the master. Keys are on your consoles, one each. All four inside five seconds, and get close. It can\'t hear you past eight units.', { urgent: true });
    }

    /** The gate opens for a ship with all four keys turned at once, close to the master. It says when it can't hear them, and when they lapse, once each time. */
    private followKeys(): void {
        const master = this.masterShip;
        if (!master) {
            return;
        }

        const now = this.state.currentTime;

        for (const ship of getPlayerShips(this.state)) {
            const turned = this.keysTurned(ship);
            let attempt = this.keyAttempts.get(ship);

            if (turned === 0) {
                if (attempt && !attempt.refused) {
                    this.hail(gateName, 'SEQUENCE INCOMPLETE.', { urgent: true });
                }
                this.keyAttempts.delete(ship);
                continue;
            }

            if (!attempt) {
                attempt = { refused: false };
                this.keyAttempts.set(ship, attempt);
            }

            if (turned < 4) {
                continue;
            }

            if (distance(ship.getPosition(now), master.getPosition(now)) <= keyRange) {
                this.openDoor(master);
                return;
            }

            if (!attempt.refused) {
                attempt.refused = true;
                this.hail(gateName, 'NO HANDSHAKE.', { urgent: true });
            }
        }
    }

    /** How many of a ship's four keys are turned just now. */
    keysTurned(ship: PlayerShip): number {
        return ship.engineerState.systems.filter(tile => isCrewRoleName(tile.system) && tile.hasEffect('keyTurned')).length;
    }

    /** The keys are accepted: the keepers take them back, the master stands down, the boat launches, and the other pylons send out drones. */
    private openDoor(master: AiShip): void {
        this.currentPhase = 'door';
        this.stopKeeping(this.keyCards);
        this.keyCards = [];
        this.keyAttempts.clear();

        this.setObjective(boatObjective);
        this.keyCards = this.keepInHand('engineer', 'extendShields');
        master.ai.commander.standDown();

        this.hail(gateName, 'INSPECTION OVERRIDE ACCEPTED. DEFENCES TO AUTOMATIC.', { urgent: true });
        this.hail(keeperTeam, 'We\'re in the door. Boat\'s launching. Ninety seconds once we dock. Keep them off us.');

        this.launchBoat();
        this.droneLaunches = this.every(droneIntervalMs, () => this.launchDrones());
    }

    /** A point on the line from the middle of the square out through the master, this far beyond it: the side away from the other pylons. */
    private beyondMaster(master: AiShip, distanceOut: number): Vector2D {
        const at = master.getPosition(this.state.currentTime);
        const centre = this.centre;
        const length = Math.hypot(at.x - centre.x, at.y - centre.y) || 1;
        return {
            x: at.x + (at.x - centre.x) / length * distanceOut,
            y: at.y + (at.y - centre.y) / length * distanceOut,
        };
    }

    /** The keepers' boat sets out, on the far side of the master from the other pylons, and flies in to dock with it. Drones already out go after it. */
    private launchBoat(): void {
        const master = this.masterShip;
        if (!master || this.currentPhase !== 'door') {
            return;
        }

        const from = this.beyondMaster(master, boatLaunchDistance);
        const dock = this.beyondMaster(master, dockOffset);

        this.dockedAt = null;
        this.boatShieldLinesSaid = 0;
        [this.boat] = this.spawnShips(keepers, [{
            design: 'keeperBoat',
            scenarioId: boatScenarioId,
            name: boatName,
            position: { ...from, angle: -Math.atan2(dock.y - from.y, dock.x - from.x) },
            goal: { type: 'travel-route', waypoints: [dock], arrivalRadius: 0.5 },
            skill: boatSkill,
        }]);

        for (const drone of this.drones) {
            drone.ai.commander.setGoal({ type: 'search-and-destroy', prefer: boatScenarioId });
        }
    }

    /** Each pylon still fighting launches a drone, while there's room for one. They hunt, preferring the boat. */
    private launchDrones(): void {
        for (const pylon of this.pylonShips) {
            if (pylon === this.masterShip || this.drones.size >= maxDrones) {
                continue;
            }

            const at = pylon.getPosition(this.state.currentTime);
            const side = this.dronesLaunched % 2 === 0 ? droneSpacing : -droneSpacing;
            this.dronesLaunched++;

            this.drones.add(...this.spawnShips(gate, [{
                design: 'drone',
                name: `Drone ${numberNames[this.dronesLaunched - 1] ?? this.dronesLaunched}`,
                position: { x: at.x, y: at.y + side, angle: at.angle },
                goal: { type: 'search-and-destroy', prefer: boatScenarioId },
                skill: pylonSkill,
            }]));
        }
    }

    /** The boat docks once it's close enough to the master, and says how its shields are holding as they fall. */
    private followBoat(): void {
        const boat = this.boat;
        const master = this.masterShip;
        if (!boat || !master) {
            return;
        }

        this.announceBoatShields(boat);

        const now = this.state.currentTime;
        if (this.dockedAt === null && distance(boat.getPosition(now), master.getPosition(now)) <= dockRadius) {
            this.dockedAt = now;
            this.hail(boatName, 'Docked. Ninety seconds.', { urgent: true });
            this.halfway = this.after(boardingMs / 2, () => this.hail(boatName, 'Halfway.'));
            this.boarding = this.after(boardingMs, () => this.liftQuarantine());
        }
    }

    /** Only the worst of what hasn't been said yet, if they fell past both at once. */
    private announceBoatShields(boat: AiShip): void {
        const fraction = boat.hullState.shield / boat.hullState.maxShield;
        let line: string | undefined;

        while (this.boatShieldLinesSaid < boatShieldLines.length && fraction <= boatShieldLines[this.boatShieldLinesSaid][0]) {
            line = boatShieldLines[this.boatShieldLinesSaid][1];
            this.boatShieldLinesSaid++;
        }

        if (line) {
            this.hail(boatName, line);
        }
    }

    /** The boat's lost. Another sets out a little later, and docking starts again from nothing. */
    private boatLost(): void {
        this.boat = null;
        this.dockedAt = null;
        this.boarding?.cancel();
        this.halfway?.cancel();

        this.hail(keeperTeam, 'We\'ve lost the boat. Second crew\'s launching.', { urgent: true });
        this.boatLaunch = this.after(secondBoatDelayMs, () => this.launchBoat());
    }

    /**
     * The master's gone. The gate picks another from those left, and it all starts again, with whatever the crew had of the keys or the door taken back.
     * Drones already out fight on. With no pylons left, the gate is open for good, which isn't what the keepers came for.
     */
    private masterDestroyed(): void {
        for (const timer of [this.boarding, this.halfway, this.boatLaunch, this.droneLaunches, this.copying, this.modeChange]) {
            timer?.cancel();
        }
        this.stopKeeping(this.keyCards);
        this.keyCards = [];
        this.keyAttempts.clear();
        this.boat?.depart();
        this.boat = null;
        this.dockedAt = null;

        if (this.currentPhase === 'door') {
            this.setObjective(gateObjective);
        }

        this.currentPhase = 'diagnose';
        this.makeMaster(this.state.random.pick(this.pylonShips.all));
        this.scheduleModeChange();
        this.hail(keeperTeam, 'That was the master! It\'ll pick another. Start again, and go easier.', { urgent: true });
    }

    /** The last pylon is gone, so the gate is open for good, and can't be closed or kept open by anybody. Half the reward, as it isn't what the keepers wanted. */
    private openForGood(): void {
        this.masterShip = null;
        for (const drone of this.drones) {
            drone.depart();
        }

        this.complete('success', 0.5);
        this.hail(keeperTeam, 'Well. It\'s open. It won\'t ever close again, which isn\'t what we came for. But it\'s open.');
    }

    /** The boat has been docked long enough: the quarantine is lifted, every pylon stands down, and the drones go. */
    private liftQuarantine(): void {
        for (const pylon of this.pylonShips) {
            pylon.ai.commander.standDown();
        }
        for (const drone of this.drones) {
            drone.depart();
        }

        this.complete('success');
        this.hail(gateName, 'QUARANTINE LIFTED. DAY ONE.', { urgent: true });
        this.hail(keeperTeam, 'It\'s open. Thirty years, and it\'s open, and it\'ll stay open. Go and tell them.');
    }
}

export const quarantineGateDefinition: EncounterDefinition = {
    id: 'quarantineGate',
    name: 'The Gate That Never Closed',
    kind: 'boss',
    objective: gateObjective,
    defaultEnvironment: 'nebula',
    request: {
        from: 'The Shallows',
        subject: 'the quarantine gate',
        text: 'Thirty years shut, over an outbreak nobody remembers. The relay keepers can lift it for good, if somebody gets them to the door.',
    },
    create: (state, node) => new QuarantineGateEncounter(state, node),
};
