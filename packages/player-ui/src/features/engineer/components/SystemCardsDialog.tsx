import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemIcon } from 'common-ui/icons/systems';
import { FC } from 'react';
import { FullScreenDialog } from 'src/components/FullScreenDialog';
import { DeckCardList } from 'src/features/deck/components/DeckCardList';
import styles from './SystemCardsDialog.module.css';
import type { Snapshot } from '@colyseus/react';

export type SystemCards = {
    hand: Snapshot<CardInstance[]>;
    /** In draw order. */
    deck: Snapshot<CardInstance[]>;
    /** Cards taken from the top of the deck while a crew member chooses one to draw. */
    pendingDrawChoice: Snapshot<CardInstance[]>;
};

type Props = SystemCards & {
    system: ShipSystem;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
};

/** Lets the engineer see all of a system's cards, so they can advise on the order cards will be drawn in, and spot unusual traits. Read-only. */
export const SystemCardsDialog: FC<Props> = (props) => {
    // Hull and reactor cards are played as soon as they're drawn, so only ever pass through their hand.
    const hasHand = props.system !== 'hull' && props.system !== 'reactor';

    return (
        <FullScreenDialog
            title={`${props.system[0].toUpperCase()}${props.system.substring(1)} cards`}
            headerStart={<SystemIcon system={props.system} className={styles.icon} />}
            isOpen={props.isOpen}
            setOpen={props.setOpen}
            bodyClassName={styles.body}
        >
            {props.pendingDrawChoice.length > 0 && (
                <section className={styles.section}>
                    <h3 className={styles.heading}>Revealed</h3>
                    <p className={styles.note}>Taken from the top of the deck, while one is chosen to draw. The rest go to the bottom.</p>
                    <DeckCardList cards={props.pendingDrawChoice} showPositions={false} highlightExtraTraits aria-label="Revealed" />
                </section>
            )}

            {hasHand && (
                <section className={styles.section}>
                    <h3 className={styles.heading}>Hand</h3>
                    {props.hand.length > 0
                        ? <DeckCardList cards={props.hand} showPositions={false} highlightExtraTraits aria-label="Hand" />
                        : <p className={styles.note}>No cards in hand.</p>}
                </section>
            )}

            <section className={styles.section}>
                <h3 className={styles.heading}>Deck – draw order</h3>
                {props.deck.length > 0
                    ? <DeckCardList cards={props.deck} highlightExtraTraits />
                    : <p className={styles.note}>The deck is empty.</p>}
            </section>
        </FullScreenDialog>
    );
};
