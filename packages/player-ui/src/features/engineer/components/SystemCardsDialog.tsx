import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { FC } from 'react';
import { FullScreenDialog } from 'src/components/FullScreenDialog';
import { DeckCardList } from 'src/features/deck/components/DeckCardList';
import { HealthBreakdown, HealthSegment, HealthSegments, SegmentState } from './HealthSegments';
import styles from './SystemCardsDialog.module.css';
import type { Snapshot } from '@colyseus/react';

export type SystemCards = {
    hand: Snapshot<CardInstance[]>;
    /** In draw order. */
    deck: Snapshot<CardInstance[]>;
};

type Props = SystemCards & {
    system: ShipSystem;
    health: HealthBreakdown;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
};

/** The system's health bar, as on its tile, with what each kind of segment means, as the tile has no room to say. */
const HealthSummary: FC<{ health: HealthBreakdown }> = ({ health }) => {
    const lines: { state: SegmentState; count: number; text: string }[] = [
        { state: 'healthy', count: health.health - health.stabilised, text: 'working' },
        { state: 'stabilised', count: health.stabilised, text: 'stabilised: critically damaged if damaged again' },
        { state: 'damaged', count: health.damaged, text: 'damaged: can be repaired' },
        { state: 'critical', count: health.critical, text: 'critically damaged: can\'t be repaired' },
    ];

    return (
        <section className={styles.health} aria-label="Health">
            <HealthSegments health={health} className={styles.healthBar} />
            <ul className={styles.healthLines}>
                {lines.filter(line => line.count > 0).map(line => (
                    <li key={line.state} className={styles.healthLine}>
                        <HealthSegment state={line.state} className={styles.swatch} />
                        {`${line.count} ${line.text}`}
                    </li>
                ))}
            </ul>
        </section>
    );
};

/** Lets the engineer see all of a system's cards, so they can advise on the order cards will be drawn in, and spot unusual traits. Read-only. */
export const SystemCardsDialog: FC<Props> = (props) => {
    // Hull and reactor cards are played as soon as they're drawn, so only ever pass through their hand.
    const hasHand = props.system !== 'hull' && props.system !== 'reactor';

    return (
        <FullScreenDialog
            title={`${props.system[0].toUpperCase()}${props.system.substring(1)} cards`}
            isOpen={props.isOpen}
            setOpen={props.setOpen}
            bodyClassName={styles.body}
        >
            <HealthSummary health={props.health} />

            {hasHand && (
                <section className={styles.section}>
                    <h3 className={styles.heading}>Hand</h3>
                    {props.hand.length > 0
                        ? <DeckCardList cards={props.hand} showPositions={false} highlightExtraTraits animateShifts ariaLabel="Hand" />
                        : <p className={styles.note}>No cards in hand.</p>}
                </section>
            )}

            <section className={styles.section}>
                <h3 className={styles.heading}>Deck</h3>
                {props.deck.length > 0
                    ? <DeckCardList cards={props.deck} highlightExtraTraits animateShifts />
                    : <p className={styles.note}>The deck is empty.</p>}
            </section>
        </FullScreenDialog>
    );
};
