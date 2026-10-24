import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { FullScreenDialog } from 'common-ui/components/FullScreenDialog';
import { SystemIcon } from 'common-ui/icons/systems';
import { FC } from 'react';
import { DeckPanel } from './DeckPanel';
import styles from './DeckView.module.css';
import type { DeckViewModel } from '../types/DeckViewModel';

type Props = DeckViewModel & {
    crew: CrewRoleName;
};

/** A full-screen modal showing a crew member's deck, in order. At a station, cards can be re-ordered and sold, and `aside` (e.g. a shop) shows alongside. */
export const DeckView: FC<Props> = props => (
    <FullScreenDialog
        title="My deck"
        isOpen={props.isOpen}
        setOpen={props.setOpen}
        headerStart={<SystemIcon system={props.crew} className={styles.icon} />}
        headerEnd={props.atStation && (
            <div className={styles.antimatter} role="status" aria-label={`Antimatter: ${props.antimatter}`}>
                <span className={styles.antimatterLabel}>Antimatter</span>
                <span className={styles.antimatterAmount}>{props.antimatter}</span>
            </div>
        )}
        bodyClassName={styles.body}
    >
        {props.notice && <p className={styles.notice} role="status">{props.notice}</p>}

        <DeckPanel
            cards={props.cards}
            atStation={props.atStation}
            moveCard={props.moveCard}
            sellCard={props.sellCard}
        />

        {props.aside}
    </FullScreenDialog>
);
