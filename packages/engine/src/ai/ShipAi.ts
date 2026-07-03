import { GameState } from 'src/state/GameState';
import { Ship } from 'src/state/Ship';
import { Commander } from './Commander';
import { EngineerOfficer } from './officers/EngineerOfficer';
import { HelmOfficer } from './officers/HelmOfficer';
import { Officer } from './officers/Officer';
import { ScienceOfficer } from './officers/ScienceOfficer';
import { TacticalOfficer } from './officers/TacticalOfficer';
import { Blackboard, createBlackboard, resolveAiConfig } from './types';
import type { AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';

export const COMMANDER_INTERVAL = 500;
export const OFFICER_INTERVAL = 1000;

/** Cheap deterministic string hash for stagger offsets. */
function stableHash(input: string): number {
    let hash = 5381;
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

export class ShipAi {
    readonly blackboard: Blackboard;
    readonly commander: Commander;
    readonly officers: Officer[];

    private nextCommanderTime: number;
    private readonly nextOfficerTime = new Map<Officer, number>();

    constructor(ship: Ship, gameState: GameState, setup: AiShipSetupInfo) {
        const config = resolveAiConfig(setup);
        this.blackboard = createBlackboard(config.goal);
        this.commander = new Commander(ship, gameState, config);
        this.officers = [
            new HelmOfficer(ship, gameState, config),
            new TacticalOfficer(ship, gameState, config),
            new ScienceOfficer(ship, gameState, config),
            new EngineerOfficer(ship, gameState, config),
        ];

        // Stagger start times so multiple AI ships (and roles) don't all think on the same frame.
        this.nextCommanderTime = stableHash(ship.id) % COMMANDER_INTERVAL;
        for (const officer of this.officers) {
            this.nextOfficerTime.set(officer, stableHash(ship.id + officer.role) % OFFICER_INTERVAL);
        }
    }

    update(currentTime: number): void {
        if (currentTime >= this.nextCommanderTime) {
            this.nextCommanderTime = currentTime + COMMANDER_INTERVAL;
            try {
                this.commander.update(this.blackboard, currentTime);
            } catch (error) {
                console.error('AI commander error:', error);
            }
        }

        for (const officer of this.officers) {
            if (currentTime >= (this.nextOfficerTime.get(officer) ?? 0)) {
                this.nextOfficerTime.set(officer, currentTime + OFFICER_INTERVAL);
                try {
                    officer.think(this.blackboard, currentTime);
                } catch (error) {
                    console.error(`AI ${officer.role} officer error:`, error);
                }
            }
        }
    }
}
