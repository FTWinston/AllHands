/** Indicate that a schema field should be sent to the same ship's game client. */
export const ownShipClientRole = 0;

/** Indicate that a schema field should be sent to the same ship's helm client. */
export const ownHelmClientRole = 1;

/** Indicate that a schema field should be sent to the same ship's sensor client. */
export const ownSensorClientRole = 2;

/** Indicate that a schema field should be sent to the same ship's tactical client. */
export const ownTacticalClientRole = 3;

/** Indicate that a schema field should be sent to the same ship's engineer client. */
export const ownEngineerClientRole = 4;

/** Indicate that a schema field should be sent to other ships' game clients. */
export const otherShipClientRole = 5;

/** Indicate that a schema field should be sent to other ships' helm clients. */
export const otherHelmClientRole = 6;

/** Indicate that a schema field should be sent to other ships' sensor clients. */
export const otherSensorClientRole = 7;

/** Indicate that a schema field should be sent to other ships' tactical clients. */
export const otherTacticalClientRole = 8;

export type CrewRole
    = | typeof ownHelmClientRole
        | typeof ownSensorClientRole
        | typeof ownTacticalClientRole
        | typeof ownEngineerClientRole;

export type CrewRoleName = 'helm' | 'sensors' | 'tactical' | 'engineer';

export const getRole: (name: CrewRoleName) => CrewRole = (name: CrewRoleName) => {
    switch (name) {
        case 'helm': return ownHelmClientRole;
        case 'sensors': return ownSensorClientRole;
        case 'tactical': return ownTacticalClientRole;
        case 'engineer': return ownEngineerClientRole;
        default: throw new Error(`Invalid crew role name: ${name}`);
    }
};
