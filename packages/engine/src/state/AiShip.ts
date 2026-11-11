import { entity } from '@colyseus/schema';
import { distanceSq } from 'common-data/features/space/utils/vectors';
import { ShipAi } from 'src/ai/ShipAi';
import { GameState } from './GameState';
import { Ship } from './Ship';
import type { AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';

/** A fleeing ship leaves the encounter once it has been at least this far from every hostile it knows of, for `departDelayMs`. */
export const departDistance = 30;
export const departDelayMs = 3000;

@entity
export class AiShip extends Ship {
    public readonly ai: ShipAi;
    /** Game time since when this ship has been fleeing and clear of every hostile, or null while it isn't. */
    private clearSince: number | null = null;

    constructor(gameState: GameState, setup: AiShipSetupInfo) {
        super(gameState, setup);
        this.ai = new ShipAi(this, gameState, setup);

        // AI ships only exist within an encounter, so they join it with their hands dealt and their shields up.
        this.dealInitialHands();
        this.hullState.restoreShields();
    }

    public override tick(deltaTime: number, currentTime: number): void {
        super.tick(deltaTime, currentTime);
        this.ai.update(currentTime);
        this.departIfClear(currentTime);
    }

    public override resolveScenarioReferences(): void {
        this.ai.commander.resolveScenarioReferences();
    }

    /**
     * Leaves the encounter in one piece: the ship jumps to warp, and is removed from the game without being destroyed.
     * Driving a ship off counts for as much as destroying it, as it's just as gone.
     */
    depart(): void {
        // Before removal, while those who can see the ship still know of it.
        this.showWarpOut();
        this.scienceState.unsubscribeFromShip();
        this.gameState.remove(this, 'departed');
    }

    /** A ship that is fleeing (or withdrawing, see `Commander.withdraw`) departs once it has kept clear of every hostile for long enough. */
    private departIfClear(currentTime: number): void {
        if (this.ai.blackboard.goal !== 'flee' || !this.isClearOfHostiles(currentTime)) {
            this.clearSince = null;
            return;
        }

        this.clearSince ??= currentTime;

        if (currentTime - this.clearSince >= departDelayMs) {
            this.depart();
        }
    }

    private isClearOfHostiles(currentTime: number): boolean {
        const registry = this.gameState.factionRegistry;
        const ownPosition = this.getPosition(currentTime);

        for (const id of this.knownObjects) {
            const other = this.gameState.objects.get(id);

            if (other && registry.areHostile(this, other) && distanceSq(ownPosition, other.getPosition(currentTime)) < departDistance ** 2) {
                return false;
            }
        }

        return true;
    }
}
