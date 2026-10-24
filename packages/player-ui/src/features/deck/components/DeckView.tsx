import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import { Button } from 'common-ui/components/Button';
import { SystemIcon } from 'common-ui/icons/systems';
import { FC } from 'react';
import { DeckPanel } from './DeckPanel';
import styles from './DeckView.module.css';
import type { DeckViewControl } from '../DeckViewControl';

type Props = DeckViewControl & {
    crew: CrewRoleName;
};

/** A full-screen modal showing a crew member's deck, in order. At a station, cards can be re-ordered and sold, and `aside` (e.g. a shop) shows alongside. */
export const DeckView: FC<Props> = props => (
    // The view covers the whole screen, and is toggled by a button outside it, so ignore "outside" presses.
    <BaseDialog.Root open={props.isOpen} onOpenChange={props.setOpen} disablePointerDismissal>
        <BaseDialog.Portal>
            <BaseDialog.Popup className={styles.popup}>
                <header className={styles.header}>
                    <SystemIcon system={props.crew} className={styles.icon} />

                    <BaseDialog.Title className={styles.title}>My deck</BaseDialog.Title>

                    {props.atStation && (
                        <div className={styles.antimatter} role="status" aria-label={`Antimatter: ${props.antimatter}`}>
                            <span className={styles.antimatterLabel}>Antimatter</span>
                            <span className={styles.antimatterAmount}>{props.antimatter}</span>
                        </div>
                    )}

                    <BaseDialog.Close render={<Button className={styles.close}>Close</Button>} />
                </header>

                {props.notice && <p className={styles.notice} role="status">{props.notice}</p>}

                <div className={styles.body}>
                    <DeckPanel
                        cards={props.cards}
                        atStation={props.atStation}
                        moveCard={props.moveCard}
                        sellCard={props.sellCard}
                    />

                    {props.aside}
                </div>
            </BaseDialog.Popup>
        </BaseDialog.Portal>
    </BaseDialog.Root>
);
