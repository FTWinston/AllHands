import { AiShip } from '../state/AiShip';
import { GameObject } from '../state/GameObject';
import { GameState } from '../state/GameState';
import { PlayerShip } from '../state/PlayerShip';
import { GameRules } from './GameRules';
import type { AiShipSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import type { ScenarioConfig } from 'common-data/types/ScenarioConfig';

export class EndlessCombatEncounters extends GameRules {
    private enemyTemplates: AiShipSetupInfo[] = [];

    constructor(state: GameState, scenario: ScenarioConfig) {
        super(state, scenario);
        this.enemyTemplates = scenario.encounters.flatMap(e => e.enemies);
    }

    populate(): void {
        // Spawn enemies from the first encounter.
        if (this.scenario.encounters.length > 0) {
            for (const enemySetup of this.scenario.encounters[0].enemies) {
                const aiShip = new AiShip(this.state, enemySetup);
                this.state.add(aiShip);
            }
        }
    }

    onObjectRemoved(object: GameObject): void {
        if (this.state.gameStatus !== 'active') {
            return;
        }

        if (object instanceof PlayerShip) {
            // End the game only when the last player ship has been destroyed.
            const anyPlayerShipAlive = [...this.state.objects.values()]
                .some(o => o instanceof PlayerShip);

            if (!anyPlayerShipAlive) {
                this.state.gameStatus = 'ended';
            }
        } else if (object instanceof AiShip) {
            // AI ship destroyed — spawn a replacement after 10 seconds.
            this.scheduleRespawn();
        }
    }

    private scheduleRespawn(): void {
        this.state.clock.setTimeout(() => {
            if (this.state.gameStatus !== 'active') {
                return;
            }

            if (this.enemyTemplates.length === 0) {
                return;
            }

            // Pick a random enemy template from the scenario's encounters.
            const template = this.state.random.pick(this.enemyTemplates);

            // Spawn at a random position in a ring around the origin, facing inward.
            const angle = Math.random() * Math.PI * 2;
            const distance = 8 + Math.random() * 4; // 8–12 units from origin

            const setup: AiShipSetupInfo = {
                ...template,
                position: {
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    angle: angle + Math.PI, // face toward center
                },
            };

            const aiShip = new AiShip(this.state, setup);
            this.state.add(aiShip);
        }, 10_000);
    }
}
