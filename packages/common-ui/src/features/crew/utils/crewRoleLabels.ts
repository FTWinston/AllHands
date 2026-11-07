import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

/** What each crew role is called, and what its crew member does. */
export const crewRoleLabels: Record<CrewRoleName, { name: string; description: string }> = {
    helm: { name: 'Helm', description: 'Move the ship and evade enemies.' },
    tactical: { name: 'Tactical', description: 'Operate the ship\'s weapons.' },
    science: { name: 'Science', description: 'Scan targets and control the deflector.' },
    engineer: { name: 'Engineer', description: 'Manage power and repair damaged systems.' },
};
