import { CombatEncounter } from 'engine/encounters/CombatEncounter';
import type { EncounterDefinition } from 'engine/encounters/EncounterDefinition';
import type { ShipSpawn } from 'engine/encounters/shipSpawns';

/** A fighter backed by a harrier. */
export class SkirmishEncounter extends CombatEncounter {
    protected readonly composition: readonly ShipSpawn[] = [{ design: 'fighter' }, { design: 'harrier' }];
}

/** Three harriers converging from different bearings. */
export class AmbushEncounter extends CombatEncounter {
    protected readonly composition: readonly ShipSpawn[] = [{ design: 'harrier' }, { design: 'harrier' }, { design: 'harrier' }];
}

/** A heavy cruiser with a fighter. */
export class AssaultEncounter extends CombatEncounter {
    protected readonly composition: readonly ShipSpawn[] = [{ design: 'bulwark' }, { design: 'fighter' }];
}

/** A heavy cruiser escorted by two harriers, who stop guarding it (and hunt) once it dies. */
export class EscortEncounter extends CombatEncounter {
    protected readonly composition: readonly ShipSpawn[] = [
        { design: 'bulwark', scenarioId: 'escortLeader' },
        { design: 'harrier', guards: 'escortLeader' },
        { design: 'harrier', guards: 'escortLeader' },
    ];
}

/** The placeholder fights, which every sector has for now. */
export const combatEncounterDefinitions: readonly EncounterDefinition[] = [
    { id: 'skirmish', name: 'Skirmish', kind: 'combat', objective: { type: 'clear' }, defaultEnvironment: 'deepSpace', create: (state, node) => new SkirmishEncounter(state, node) },
    { id: 'ambush', name: 'Ambush', kind: 'combat', objective: { type: 'clear' }, defaultEnvironment: 'asteroidField', create: (state, node) => new AmbushEncounter(state, node) },
    { id: 'assault', name: 'Assault', kind: 'combat', objective: { type: 'clear' }, defaultEnvironment: 'nebula', create: (state, node) => new AssaultEncounter(state, node) },
    { id: 'escort', name: 'Escorted Cruiser', kind: 'combat', objective: { type: 'clear' }, defaultEnvironment: 'gasGiant', create: (state, node) => new EscortEncounter(state, node) },
];
