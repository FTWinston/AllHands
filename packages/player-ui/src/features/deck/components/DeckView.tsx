import { FC } from 'react';
import { FullScreenDialog } from 'src/components/FullScreenDialog';
import { DeckPanel } from './DeckPanel';
import styles from './DeckView.module.css';
import type { DeckViewModel } from '../types/DeckViewModel';

/**
 * Shows a crew member's deck, in order, covering everything below their header. At a station, cards can be re-ordered and sold.
 * It has no close button, as the deck button in the crew header toggles it.
 */
export const DeckView: FC<DeckViewModel> = props => (
    <FullScreenDialog
        title="My deck"
        isOpen={props.isOpen}
        setOpen={props.setOpen}
        noCloseButton
        bodyClassName={styles.body}
    >
        <DeckPanel
            cards={props.cards}
            atStation={props.atStation}
            moveCard={props.moveCard}
            sellCard={props.sellCard}
        />
    </FullScreenDialog>
);
