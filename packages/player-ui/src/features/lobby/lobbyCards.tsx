import { CrewRole, CrewRoleName, ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { UICardDefinition } from 'common-ui/features/cards/types/UICardDefinition';
import { crewRoleLabels } from 'common-ui/features/crew/utils/crewRoleLabels';
import { SystemIcon } from 'common-ui/icons/systems';
import styles from './LobbyCard.module.css';

/** A card in the lobby hand. Its id is the role it claims, so a dropped card's id can be sent straight to the server. */
export type LobbyCard = {
    id: CrewRole;
    system: CrewRoleName;
};

export const lobbyCards: LobbyCard[] = [
    { id: ownHelmClientRole, system: 'helm' },
    { id: ownTacticalClientRole, system: 'tactical' },
    { id: ownScienceClientRole, system: 'science' },
    { id: ownEngineerClientRole, system: 'engineer' },
];

/**
 * Lobby cards are not card definitions, so what they show is built from the system they claim.
 * A system occupied by another player costs 1, more power than the lobby ever has, so it shows as unplayable.
 */
export function getLobbyCardDefinition(system: CrewRoleName, occupied = false): UICardDefinition {
    return {
        targetType: 'no-target',
        system,
        parameters: { cost: occupied ? 1 : 0 },
        ...crewRoleLabels[system],
        image: <SystemIcon system={system} className={styles.image} />,
    };
}
