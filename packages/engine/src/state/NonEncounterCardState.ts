import { Schema, type } from '@colyseus/schema';
import { RouteCardInfoState } from './RouteCardInfoState';
import type { NonEncounterCardInfo, NonEncounterCardKind } from 'common-data/features/cards/types/NonEncounterCardInfo';
import type { RouteCardInfo } from 'common-data/features/cards/types/RouteCardInfo';

export class NonEncounterCardState extends Schema implements NonEncounterCardInfo {
    constructor(id: number, kind: NonEncounterCardKind, route: RouteCardInfo) {
        super();
        this.id = id;
        this.kind = kind;
        this.route = new RouteCardInfoState(route);
    }

    @type('number') readonly id: number;
    @type('string') readonly kind: NonEncounterCardKind;
    @type(RouteCardInfoState) readonly route: RouteCardInfoState;
}
