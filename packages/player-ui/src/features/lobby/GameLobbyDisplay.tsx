import { CrewRole, ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { soloCrewIdentifier } from 'common-data/utils/constants';
import { Screen } from 'common-ui/components/Screen';
import crewStyles from 'common-ui/CrewColors.module.css';
import { classNames } from 'common-ui/utils/classNames';
import { FC, useMemo } from 'react';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { DragCardProvider } from 'src/features/cardui/components/DragCardProvider';
import styles from './GameLobbyDisplay.module.css';
import { lobbyCards } from './lobbyCards';
import { LobbyHand } from './LobbyHand';
import { RoleSlot } from './RoleSlot';

export type Props = {
    crewId: string;
    role: CrewRole | null;
    helmOccupied: boolean;
    tacticalOccupied: boolean;
    scienceOccupied: boolean;
    engineerOccupied: boolean;
    onRoleChange: (role: CrewRole | '') => void;
};

export const GameLobbyDisplay: FC<Props> = (props) => {
    const {
        crewId,
        role,
        helmOccupied,
        tacticalOccupied,
        scienceOccupied,
        engineerOccupied,
        onRoleChange,
    } = props;

    const isOccupied = (cardRole: CrewRole) => {
        switch (cardRole) {
            case ownHelmClientRole: return helmOccupied;
            case ownTacticalClientRole: return tacticalOccupied;
            case ownScienceClientRole: return scienceOccupied;
            case ownEngineerClientRole: return engineerOccupied;
        }
    };

    // The card for this player's own role is in the slot, rather than their hand.
    const handCards = useMemo(() => lobbyCards.filter(card => card.id !== role), [role]);

    // Once claimed, the screen takes on that system's colours.
    const system = lobbyCards.find(card => card.id === role)?.system;

    return (
        <Screen padded className={classNames(styles.screen, system ? crewStyles[system] : null)}>
            {/* Played cards are shown in the role slot. */}
            <DragCardProvider onCardDropped={cardId => onRoleChange(cardId as CrewRole)} noDropEffect>
                <CardDropTarget
                    id="noTarget"
                    targetType="no-target"
                    disabled={role !== null}
                    canAcceptCard={card => !isOccupied(card.id as CrewRole)}
                />

                <h1 className={styles.title}>Choose your role</h1>
                {crewId !== soloCrewIdentifier && (
                    <p>
                        You are a member of crew
                        {' '}
                        {crewId}
                        .
                    </p>
                )}

                <p className={styles.instructions}>
                    {role === null
                        ? 'Drag a card from your hand to claim a role.'
                        : 'When every role is claimed, the game will start.'}
                </p>

                <RoleSlot role={role} onRelease={() => onRoleChange('')} isOccupied={isOccupied} />

                <LobbyHand cards={handCards} isOccupied={isOccupied} hasRole={role !== null} />
            </DragCardProvider>
        </Screen>
    );
};
