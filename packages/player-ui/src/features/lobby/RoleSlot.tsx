import { CrewRole } from 'common-data/features/ships/types/CrewRole';
import { Button } from 'common-ui/components/Button';
import { CardBase } from 'common-ui/features/cards/components/CardBase';
import { CardDisplay } from 'common-ui/features/cards/components/CardDisplay';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import { useActiveCard } from 'src/features/cardui/components/DragCardProvider';
import { getLobbyCardDefinition, lobbyCards } from './lobbyCards';
import styles from './RoleSlot.module.css';

type Props = {
    role: CrewRole | null;
    canRelease: boolean;
    onRelease: () => void;
    isOccupied: (role: CrewRole) => boolean;
};

/** Holds the card for the system this player has claimed, or invites them to play one. */
export const RoleSlot: FC<Props> = ({ role, canRelease, onRelease, isOccupied }) => {
    const activeCard = useActiveCard();

    const system = lobbyCards.find(card => card.id === role)?.system;

    if (!system) {
        const awaitingCard = activeCard !== null && !isOccupied(activeCard.id as CrewRole);

        return (
            <div className={styles.slot}>
                <CardBase className={classNames(styles.card, styles.emptySlot, awaitingCard ? styles.awaitingCard : null)}>
                    <div className={styles.emptyLabel}>
                        {awaitingCard ? 'Drop to claim this system' : 'Drag a card here'}
                    </div>
                </CardBase>
            </div>
        );
    }

    return (
        <div className={styles.slot}>
            <CardDisplay {...getLobbyCardDefinition(system)} className={styles.card} slotted={true} />

            <Button onClick={onRelease} disabled={!canRelease} className={styles.release}>
                Change role
            </Button>
        </div>
    );
};
