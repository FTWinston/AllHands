import { ArraySchema, Schema, type, view } from '@colyseus/schema';
import { otherHelmClientRole, otherScienceClientRole, otherShipClientRole, otherTacticalClientRole, ownHelmClientRole, ownShipClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { Damage } from 'common-data/features/space/types/Damage';
import { GameObjectInfo, GameObjectSetupInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { Position } from 'common-data/features/space/types/Position';
import { interpolatePosition } from 'common-data/features/space/utils/interpolate';
import { IRandom } from 'common-data/types/IRandom';
import { GameState } from './GameState';
import { MotionKeyframe } from './MotionKeyframe';

export abstract class GameObject extends Schema implements GameObjectInfo {
    constructor(
        protected readonly gameState: GameState,
        setup: GameObjectSetupInfo
    ) {
        super();
        this.id = gameState.getNewId();
        this.scenarioId = setup.id ?? null;
        this.name = setup.name;
        this.faction = setup.faction ?? null;
        this.appearance = setup.appearance;
    }

    @type('string') public readonly id: string;

    /**
     * Scenario-authored id from the scenario file's `id` field, if any (see
     * `GameObjectSetupInfo.id`). Used only to resolve scenario-authored references; not sent
     * to clients.
     */
    public readonly scenarioId: string | null;

    @view(ownHelmClientRole | ownShipClientRole | otherHelmClientRole | otherShipClientRole | otherTacticalClientRole | otherScienceClientRole)
    @type('string') public readonly name: string;

    @view(ownHelmClientRole | ownShipClientRole | otherHelmClientRole | otherShipClientRole | otherTacticalClientRole | otherScienceClientRole)
    @type('string') public readonly appearance: ObjectAppearance;

    @type('string') public readonly faction: string | null;

    @view(ownHelmClientRole | ownShipClientRole | otherHelmClientRole | otherShipClientRole | ownTacticalClientRole | otherTacticalClientRole)
    @type([MotionKeyframe]) motion = new ArraySchema<MotionKeyframe>();

    getPosition(currentTime: number): Position {
        return interpolatePosition(this.motion, currentTime);
    }

    public get random(): IRandom {
        return this.gameState.random;
    }

    public tick(_deltaTime: number, _currentTime: number) {}

    /**
     * Resolves any scenario-authored references this object holds (e.g. an AI ship's
     * `guard-ship` goal) from `scenarioId`s to real runtime ids, now that the rest of its
     * batch (see `GameRules.spawnObjects`) has been created. No-op by default; overridden
     * where relevant.
     */
    resolveScenarioReferences(): void {}

    damage(_damage: Damage) {
        // Can't damage an arbitrary game object, but subclasses can override this to be damageable.
    }

    destroy() {
        this.gameState.remove(this);
    }
}
