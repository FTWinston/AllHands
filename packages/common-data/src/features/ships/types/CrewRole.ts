/** Indicate that a schema field should only be sent to the ship's game client. */
export const shipClientRole = 0;

/** Indicate that a schema field should only be sent to the helm client. */
export const helmClientRole = 1;

/** Indicate that a schema field should only be sent to the sensor client. */
export const sensorClientRole = 2;

/** Indicate that a schema field should only be sent to the tactical client. */
export const tacticalClientRole = 3;

/** Indicate that a schema field should only be sent to the engineer client. */
export const engineerClientRole = 4;

export type CrewRole
    = | typeof helmClientRole
        | typeof sensorClientRole
        | typeof tacticalClientRole
        | typeof engineerClientRole;

export type CrewRoleName = 'helm' | 'sensors' | 'tactical' | 'engineer';

export const getRole: (name: CrewRoleName) => CrewRole = (name: CrewRoleName) => {
    switch (name) {
        case 'helm': return helmClientRole;
        case 'sensors': return sensorClientRole;
        case 'tactical': return tacticalClientRole;
        case 'engineer': return engineerClientRole;
        default: throw new Error(`Invalid crew role name: ${name}`);
    }
};
