import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { FullScreenDialog } from 'common-ui/components/FullScreenDialog';
import { default as AntimatterIcon } from 'common-ui/icons/antimatter.svg?react';
import { SystemIcon } from 'common-ui/icons/systems';
import { FC, ReactNode } from 'react';
import { DeckPanel } from './DeckPanel';
import styles from './DeckView.module.css';
import type { DeckViewModel } from '../types/DeckViewModel';

type Props = DeckViewModel & {
    crew: CrewRoleName;
    /** Shown at the start of the header, as the crew header it covers would show it, e.g. the crew menu button. */
    menu?: ReactNode;
};

/** A full-screen modal showing a crew member's deck, in order. At a station, cards can be re-ordered and sold. */
export const DeckView: FC<Props> = props => (
    <FullScreenDialog
        title="My deck"
        isOpen={props.isOpen}
        setOpen={props.setOpen}
        headerStart={(
            <>
                {props.menu}
                <SystemIcon system={props.crew} className={styles.icon} />
            </>
        )}
        headerEnd={props.antimatter !== null && (
            <div className={styles.antimatter} role="status" aria-label={`Antimatter: ${props.antimatter}`}>
                <AntimatterIcon className={styles.antimatterIcon} />
                <span className={styles.antimatterAmount}>{props.antimatter}</span>
            </div>
        )}
        headerClassName={styles.header}
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
