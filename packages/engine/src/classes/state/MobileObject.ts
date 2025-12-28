import { type } from '@colyseus/schema';
import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { Position } from 'common-data/features/space/types/Position';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { GameObject } from './GameObject';
import { GameState } from './GameState';

export abstract class MobileObject extends GameObject {
    constructor(
        gameState: GameState,
        relationship: RelationshipType,
        appearance: ObjectAppearance,
        position: Position) {
        super(gameState, relationship, appearance, position);
    }

    public override tick(deltaTime: number) {
        super.tick(deltaTime);

        this.updateMotion();
    }

    protected abstract updateMotion(): void;

    @type('boolean') dummy2 = true; // TODO: remove when class has its own @type fields
}
