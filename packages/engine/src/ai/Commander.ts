import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { AiGoalInfo } from 'common-data/features/space/types/GameObjectInfo';
import { Position } from 'common-data/features/space/types/Position';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { distance, polarToCartesian } from 'common-data/features/space/utils/vectors';
import { GameObject } from 'src/state/GameObject';
import { GameState } from 'src/state/GameState';
import { Ship } from 'src/state/Ship';
import { getDesiredRangeFromSlots } from './evaluators/helpers';
import { Blackboard, ResolvedAiConfig, SKILL_NOISE_SCALE, SKILL_SKIP_CHANCE } from './types';

const TARGET_SWITCH_FACTOR = 1.25;
const GUARD_LEASH = 30;
const FLEE_DISTANCE = 50;
const EVASIVE_HULL_FRACTION = 0.5;
const WANDER_DISTANCE = 40;
const WANDER_ARRIVAL_RADIUS = 5;

export class Commander {
    private activeGoal: AiGoalInfo;
    /** Current patrol-wander waypoint for search-and-destroy with no known/last-known hostile. Commander-private. */
    private wanderDestination: Vector2D | null = null;

    constructor(
        private readonly ship: Ship,
        private readonly gameState: GameState,
        private readonly config: ResolvedAiConfig
    ) {
        this.activeGoal = config.goal;
    }

    update(blackboard: Blackboard, currentTime: number): void {
        const skill = this.config.skill;
        // A low-skill commander sometimes fails to reassess the situation at all.
        if (skill < 1 && this.gameState.random.getBoolean(SKILL_SKIP_CHANCE * (1 - skill))) {
            return;
        }

        this.prunePowerRequests(blackboard, currentTime);

        const ownPosition = this.ship.getPosition(currentTime);
        const hullFraction = this.ship.hullState.health / this.ship.hullState.maxHealth;

        // Guard whose ward has died switches goal permanently.
        if (this.activeGoal.type === 'guard-ship' && !this.gameState.objects.has(this.activeGoal.shipId)) {
            this.activeGoal = { type: 'search-and-destroy' };
        }

        // Flee transitions, with hysteresis.
        if (blackboard.goal !== 'flee') {
            if (this.config.fleeThreshold > 0 && hullFraction < this.config.fleeThreshold) {
                blackboard.goal = 'flee';
            } else {
                blackboard.goal = this.activeGoal.type;
            }
        } else if (hullFraction >= Math.min(2 * this.config.fleeThreshold, 1)) {
            blackboard.goal = this.activeGoal.type;
        }

        const hostiles = this.getHostilesInScope(currentTime);

        this.updateTarget(blackboard, hostiles, ownPosition, currentTime, skill);
        this.updateStance(blackboard, hullFraction);

        blackboard.desiredRange = getDesiredRangeFromSlots(this.ship.tacticalState.slots) ?? { min: 2, max: 8 };
        this.updateDestination(blackboard, hostiles, ownPosition, currentTime);
        this.updateFocusSystem(blackboard);
    }

    private prunePowerRequests(blackboard: Blackboard, currentTime: number) {
        for (const [system, request] of blackboard.powerRequests) {
            if (request.expires <= currentTime) {
                blackboard.powerRequests.delete(system);
            }
        }
    }

    private getHostilesInScope(currentTime: number): GameObject[] {
        const registry = this.gameState.factionRegistry;
        let hostiles = [...this.ship.knownObjects]
            .map(id => this.gameState.objects.get(id))
            .filter((o): o is GameObject => o !== undefined && registry.areHostile(this.ship, o));

        if (this.activeGoal.type === 'defend-position') {
            const anchor = this.activeGoal.position;
            const radius = this.activeGoal.radius;
            hostiles = hostiles.filter(h => distance(h.getPosition(currentTime), anchor) <= radius);
        } else if (this.activeGoal.type === 'guard-ship') {
            const ward = this.gameState.objects.get(this.activeGoal.shipId);
            if (ward) {
                const wardPosition = ward.getPosition(currentTime);
                hostiles = hostiles.filter(h => distance(h.getPosition(currentTime), wardPosition) <= GUARD_LEASH);
            }
        }

        return hostiles;
    }

    private updateTarget(blackboard: Blackboard, hostiles: GameObject[], ownPosition: Position, currentTime: number, skill: number) {
        if (blackboard.goal === 'flee') {
            blackboard.targetId = null;
            return;
        }

        // Perceived scores: a low-skill commander misjudges which target matters most.
        const noise = () => (skill < 1 ? this.gameState.random.getFloat(-1, 1) * SKILL_NOISE_SCALE * (1 - skill) : 0);
        const scored = new Map(hostiles.map(h => [h, 100 - distance(ownPosition, h.getPosition(currentTime)) + noise()]));

        const current = hostiles.find(h => h.id === blackboard.targetId) ?? null;
        const best = hostiles.reduce<GameObject | null>((a, b) => (a === null || scored.get(b)! > scored.get(a)! ? b : a), null);

        if (current === null) {
            blackboard.targetId = best?.id ?? null;
        } else if (best !== null && best !== current && scored.get(best)! >= scored.get(current)! * TARGET_SWITCH_FACTOR) {
            blackboard.targetId = best.id;
        }

        const target = blackboard.targetId !== null ? this.gameState.objects.get(blackboard.targetId) : undefined;
        if (target) {
            const pos = target.getPosition(currentTime);
            blackboard.lastKnownTargetPosition = { x: pos.x, y: pos.y };
        }
    }

    private updateStance(blackboard: Blackboard, hullFraction: number) {
        if (blackboard.goal === 'flee') {
            blackboard.stance = 'withdrawing';
        } else if (blackboard.targetId !== null) {
            blackboard.stance = hullFraction < EVASIVE_HULL_FRACTION ? 'evasive' : 'aggressive';
        } else {
            blackboard.stance = 'holding';
        }
    }

    private updateDestination(blackboard: Blackboard, hostiles: GameObject[], ownPosition: Position, currentTime: number) {
        if (blackboard.goal === 'flee') {
            const nearest = hostiles.reduce<GameObject | null>((a, b) =>
                (a === null || distance(ownPosition, b.getPosition(currentTime)) < distance(ownPosition, a.getPosition(currentTime)) ? b : a), null);
            if (nearest) {
                const from = nearest.getPosition(currentTime);
                const away = { x: ownPosition.x - from.x, y: ownPosition.y - from.y };
                const length = Math.max(0.001, Math.sqrt(away.x * away.x + away.y * away.y));
                blackboard.destination = {
                    x: ownPosition.x + (away.x / length) * FLEE_DISTANCE,
                    y: ownPosition.y + (away.y / length) * FLEE_DISTANCE,
                };
            } else {
                blackboard.destination = null;
            }
            return;
        }

        if (this.activeGoal.type === 'defend-position') {
            blackboard.destination = this.activeGoal.position;
        } else if (this.activeGoal.type === 'guard-ship') {
            const ward = this.gameState.objects.get(this.activeGoal.shipId);
            blackboard.destination = ward ? ward.getPosition(currentTime) : null;
        } else {
            const target = blackboard.targetId !== null ? this.gameState.objects.get(blackboard.targetId) : undefined;
            const targetPosition = target ? target.getPosition(currentTime) : null;

            if (targetPosition) {
                blackboard.destination = targetPosition;
                this.wanderDestination = null;
            } else {
                if (blackboard.lastKnownTargetPosition && distance(ownPosition, blackboard.lastKnownTargetPosition) <= WANDER_ARRIVAL_RADIUS) {
                    // Arrived at the last-known position without reacquiring a target: it's stale
                    // now, so give up on it and fall through to patrol-wander in this same update
                    // (design §5.1's full chain: pursue known hostile -> head to its last-known
                    // position -> once that's been investigated and found empty, patrol-wander).
                    blackboard.lastKnownTargetPosition = null;
                }

                // re-check: may have just been cleared above
                if (blackboard.lastKnownTargetPosition) {
                    blackboard.destination = blackboard.lastKnownTargetPosition;
                    this.wanderDestination = null;
                } else {
                    if (!this.wanderDestination || distance(ownPosition, this.wanderDestination) <= WANDER_ARRIVAL_RADIUS) {
                        const bearing = this.gameState.random.getFloat(-Math.PI, Math.PI);
                        const offset = polarToCartesian(bearing, WANDER_DISTANCE);
                        this.wanderDestination = { x: ownPosition.x + offset.x, y: ownPosition.y + offset.y };
                    }
                    blackboard.destination = this.wanderDestination;
                }
            }
        }
    }

    private updateFocusSystem(blackboard: Blackboard) {
        blackboard.focusSystem = null;
        if (blackboard.targetId === null) {
            return;
        }
        const subTargets = this.ship.tacticalState.subTargetsByTarget.get(blackboard.targetId)?.subTargets;
        if (!subTargets || subTargets.length === 0) {
            return;
        }
        const preference: ShipSystem[] = ['tactical', 'helm'];
        for (const wanted of preference) {
            const match = subTargets.find(st => st.system === wanted);
            if (match) {
                blackboard.focusSystem = match.system;
                return;
            }
        }
        blackboard.focusSystem = subTargets[0].system;
    }
}
