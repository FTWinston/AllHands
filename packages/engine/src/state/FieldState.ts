import { Schema, entity, type } from '@colyseus/schema';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { isInsideField } from 'common-data/features/space/utils/isInsideField';
import { Ship } from './Ship';
import type { GameState } from './GameState';
import type { DeflectorEffectSubstance } from 'common-data/features/cards/types/CardDefinition';
import type { FieldInfo } from 'common-data/features/space/types/FieldInfo';
import type { Vector2D } from 'common-data/features/space/types/Vector2D';

export interface FieldSetup {
    /** Where the centre of the oval is. */
    position: Vector2D;
    /** The direction its long axis points in. */
    angle: number;
    radiusX: number;
    radiusY: number;
    /** How long it lasts, in milliseconds. */
    duration: number;
    /** What the field does, which tints it. */
    substance: DeflectorEffectSubstance;
    /** Whether it acts on friendly ships (to `faction`), rather than hostile ones. */
    friendly: boolean;
    /** The faction that left it, which decides which ships are friendly or hostile to it. */
    faction: string | null;
    /** How often it acts on the ships inside it, in milliseconds. */
    interval: number;
    /** What it does to a ship inside it, each time it acts. `entered` is true the first time it acts on that ship since the ship came into it. */
    affect: (ship: Ship, entered: boolean) => void;
}

/**
 * A lingering zone in space: an oval that acts on the ships inside it, at a regular interval, until it expires.
 * It's not a game object: it's kept apart from `GameState.objects`, so it's never taken for a ship, or something that can be targeted. Every client is sent every field.
 */
@entity
export class FieldState extends Schema implements FieldInfo {
    constructor(private readonly gameState: GameState, private readonly setup: FieldSetup) {
        super();
        this.id = gameState.getNewId();
        this.x = setup.position.x;
        this.y = setup.position.y;
        this.angle = setup.angle;
        this.radiusX = setup.radiusX;
        this.radiusY = setup.radiusY;
        this.substance = setup.substance;
        this.friendly = setup.friendly;
        this.faction = setup.faction;
        this.endTime = gameState.currentTime + setup.duration;
        this.nextActionTime = gameState.currentTime;
    }

    @type('string') readonly id: string;
    @type('number') readonly x: number;
    @type('number') readonly y: number;
    @type('number') readonly angle: number;
    @type('number') readonly radiusX: number;
    @type('number') readonly radiusY: number;
    @type('number') readonly endTime: number;
    @type('string') readonly substance: DeflectorEffectSubstance;
    @type('boolean') readonly friendly: boolean;

    /** Server-only. The faction that left it. */
    readonly faction: string | null;

    private nextActionTime: number;

    /** The ids of the ships it acted on last time, so it can tell when one has just come in. */
    private readonly inside = new Set<string>();

    /** Whether a ship is the kind this field acts on: hostile ones, or if it's friendly, friendly ones. */
    affects(ship: Ship): boolean {
        const relationship = this.gameState.factionRegistry.getRelationshipBetween(this.faction, ship.faction);
        return relationship === (this.friendly ? RelationshipType.Friendly : RelationshipType.Hostile);
    }

    /** The ships that are inside the oval now, of the kind it acts on. */
    shipsInside(currentTime: number): Ship[] {
        const ships: Ship[] = [];

        for (const object of this.gameState.objects.values()) {
            if (object instanceof Ship && this.affects(object) && isInsideField(this, object.getPosition(currentTime))) {
                ships.push(object);
            }
        }

        return ships;
    }

    /** Remove the field once it's expired, otherwise act on the ships inside it if it's time to. */
    update(currentTime: number) {
        if (currentTime >= this.endTime) {
            this.gameState.removeField(this);
            return;
        }

        if (currentTime < this.nextActionTime) {
            return;
        }

        this.nextActionTime = currentTime + this.setup.interval;

        const ships = this.shipsInside(currentTime);
        const previous = new Set(this.inside);
        this.inside.clear();

        for (const ship of ships) {
            this.inside.add(ship.id);
            this.setup.affect(ship, !previous.has(ship.id));
        }
    }
}
