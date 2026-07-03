import { MapSchema } from '@colyseus/schema';
import { FactionConfig } from 'common-data/features/space/types/FactionConfig';
import { RelationshipType } from 'common-data/features/space/types/RelationshipType';
import { FactionState } from 'src/state/FactionState';
import { BindableEvent } from './BindableEvent';
import type { GameObject } from 'src/state/GameObject';

/** Higher value wins when two declarations conflict. */
const severity: Partial<Record<RelationshipType, number>> = {
    [RelationshipType.Hostile]: 3,
    [RelationshipType.Neutral]: 2,
    [RelationshipType.Friendly]: 1,
};

export class FactionRegistry {
    constructor(private readonly factions: MapSchema<FactionState>) {}

    readonly relationsChanged = new BindableEvent<() => void>();

    init(configs: FactionConfig[]): void {
        for (const config of configs) {
            this.factions.set(config.id, new FactionState(config.id));
        }

        // Apply declared relations symmetrically; where both sides declare, the more hostile wins.
        for (const config of configs) {
            for (const [otherId, relation] of Object.entries(config.relations ?? {})) {
                if (!this.factions.has(otherId)) {
                    continue;
                }
                const existing = this.factions.get(otherId)!.relations.get(config.id);
                const winner = existing !== undefined && (severity[existing] ?? 0) > (severity[relation] ?? 0)
                    ? existing
                    : relation;
                this.setRelationInternal(config.id, otherId, winner);
            }
        }
    }

    private setRelationInternal(factionA: string, factionB: string, relation: RelationshipType) {
        this.factions.get(factionA)?.relations.set(factionB, relation);
        this.factions.get(factionB)?.relations.set(factionA, relation);
    }

    getRelationshipBetween(viewerFaction: string | null, otherFaction: string | null): RelationshipType {
        if (viewerFaction === null || otherFaction === null) {
            return RelationshipType.None;
        }
        if (viewerFaction === otherFaction) {
            return RelationshipType.Friendly;
        }
        return this.factions.get(viewerFaction)?.relations.get(otherFaction) ?? RelationshipType.Neutral;
    }

    getRelationship(viewer: GameObject, other: GameObject): RelationshipType {
        return this.getRelationshipBetween(viewer.faction, other.faction);
    }

    areHostile(a: GameObject, b: GameObject): boolean {
        return this.getRelationshipBetween(a.faction, b.faction) === RelationshipType.Hostile;
    }

    setRelationship(factionA: string, factionB: string, relation: RelationshipType): void {
        this.setRelationInternal(factionA, factionB, relation);
        this.relationsChanged.trigger();
    }
}
