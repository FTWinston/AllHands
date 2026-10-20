/** Indicate that a schema field should be sent to the same ship's game client. */
export const ownShipClientRole = 1;

/** Indicate that a schema field should be sent to the same ship's helm client. */
export const ownHelmClientRole = 2;

/** Indicate that a schema field should be sent to the same ship's science client. */
export const ownScienceClientRole = 4;

/** Indicate that a schema field should be sent to the same ship's tactical client. */
export const ownTacticalClientRole = 8;

/** Indicate that a schema field should be sent to the same ship's engineer client. */
export const ownEngineerClientRole = 16;

/** Indicate that a schema field should be sent to other ships' game clients. */
export const otherShipClientRole = 32;

/** Indicate that a schema field should be sent to other ships' helm clients. */
export const otherHelmClientRole = 64;

/** Indicate that a schema field should be sent to other ships' science clients. */
export const otherScienceClientRole = 128;

/** Indicate that a schema field should be sent to other ships' tactical clients. */
export const otherTacticalClientRole = 256;

export type CrewRole
    = | typeof ownHelmClientRole
        | typeof ownScienceClientRole
        | typeof ownTacticalClientRole
        | typeof ownEngineerClientRole;

export type CrewRoleName = 'helm' | 'science' | 'tactical' | 'engineer';

export const getRole: (name: CrewRoleName) => CrewRole = (name: CrewRoleName) => {
    switch (name) {
        case 'helm': return ownHelmClientRole;
        case 'science': return ownScienceClientRole;
        case 'tactical': return ownTacticalClientRole;
        case 'engineer': return ownEngineerClientRole;
        default: throw new Error(`Invalid crew role name: ${name}`);
    }
};
