import { RelationshipType } from './RelationshipType';

export interface FactionConfig {
    id: string;
    /** Relations to other factions, by faction id. Applied symmetrically; undeclared pairs default to Neutral. */
    relations?: Record<string, RelationshipType>;
}
