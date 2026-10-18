import type { RouteCardInfo } from './RouteCardInfo';

export type NonEncounterCardKind = 'route';

/**
 * A card that is shown to a crew member outside of the encounter play, such as choosing a route.
 * These are built dynamically by the campaign rather than being card definitions, and are never part of a deck or hand.
 */
export interface NonEncounterCardInfo {
    id: number;
    kind: NonEncounterCardKind;
    route: RouteCardInfo;
}
