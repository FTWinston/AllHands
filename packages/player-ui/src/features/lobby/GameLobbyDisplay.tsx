import { CrewRole, ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { soloCrewIdentifier } from 'common-data/utils/constants';
import { Screen } from 'common-ui/components/Screen';
import { ToggleButton } from 'common-ui/components/ToggleButton';
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
    ready: boolean;
    helmOccupied: boolean;
    tacticalOccupied: boolean;
    scienceOccupied: boolean;
    engineerOccupied: boolean;
    onRoleChange: (role: CrewRole | '') => void;
    onReadyChange: (ready: boolean) => void;
};

export const GameLobbyDisplay: FC<Props> = (props) => {
    const {
        crewId,
        role,
        ready,
        helmOccupied,
        tacticalOccupied,
        scienceOccupied,
        engineerOccupied,
        onRoleChange,
        onReadyChange,
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

    const isReady = role !== null && ready;

    return (
        <Screen padded className={styles.screen}>
            <DragCardProvider onCardDropped={cardId => onRoleChange(cardId as CrewRole)}>
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
                        : 'When every system is claimed and everyone is ready, the game will start.'}
                </p>

                <RoleSlot role={role} canRelease={!isReady} onRelease={() => onRoleChange('')} isOccupied={isOccupied} />

                <div className={styles.footer}>
                    <ToggleButton
                        pressed={isReady}
                        disabled={role === null}
                        onPressedChanged={onReadyChange}
                        className={styles.readyToggle}
                    >
                        {isReady ? 'Ready' : 'Not Ready'}
                    </ToggleButton>
                </div>

                <LobbyHand cards={handCards} isOccupied={isOccupied} hasRole={role !== null} />
            </DragCardProvider>
        </Screen>
    );
};
