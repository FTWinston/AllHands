import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

/** What each crew role is called, and what its crew member does. */
export const crewRoleLabels: Record<CrewRoleName, { name: string; description: string }> = {
    helm: { name: 'Helm', description: 'Steer the ship and control its speed.' },
    tactical: { name: 'Tactical', description: 'Choose targets and fire the ship\'s weapons.' },
    science: { name: 'Science', description: 'Scan targets and read long range sensors.' },
    engineer: { name: 'Engineer', description: 'Manage power and repair damaged systems.' },
};
