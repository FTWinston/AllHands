import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { getShieldAbsorption, getShieldDrainPercent, shieldCollapsePercent } from 'common-data/features/ships/utils/shieldStats';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { default as HealthIcon } from 'common-ui/icons/health.svg?react';
import { ShieldsIcon } from 'common-ui/icons/systems';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import { FullScreenDialog } from 'src/components/FullScreenDialog';
import { DeckCardList } from 'src/features/deck/components/DeckCardList';
import { HealthBar, HealthBreakdown, HealthSwatch, SegmentState } from './HealthBar';
import { getShieldPercent, ShieldBar, ShieldInfo, ShieldPercent } from './ShieldBar';
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
    /** The hull's shields. Undefined for other systems. */
    shield?: ShieldInfo;
    /** The system's power level, which for the hull sets how much the shields absorb, and how much that drains them. */
    power: number;
    shieldReinforced: boolean;
    isOpen: boolean;
    setOpen: (open: boolean) => void;
};

/** The system's health bar, as on its tile, which opens a breakdown of what's happened to its cards, as the tile has no room to say. */
const HealthStat: FC<{ health: HealthBreakdown }> = ({ health }) => {
    const lines: { state: SegmentState; count: number; text: string }[] = [
        { state: 'healthy', count: health.health - health.stabilised, text: 'nominal' },
        { state: 'stabilised', count: health.stabilised, text: 'stabilised: critically damaged if damaged again' },
        { state: 'damaged', count: health.damaged, text: 'damaged: can be repaired' },
        { state: 'critical', count: health.critical, text: 'critically damaged: can\'t be repaired' },
    ];

    return (
        <InfoPopup
            className={styles.stat}
            name={`Health (${health.health}/${health.maxHealth})`}
            ariaLabel={`Health ${health.health} of ${health.maxHealth}`}
            description={(
                <>
                    {lines.filter(line => line.count > 0).map(line => (
                        <span key={line.state} className={styles.breakdownLine}>
                            <HealthSwatch state={line.state} className={styles.swatch} />
                            {`${line.count} ${line.text}`}
                        </span>
                    ))}
                </>
            )}
        >
            <HealthIcon className={styles.statIcon} />
            <HealthBar health={health} className={styles.statBar} />
            <span className={classNames(styles.statValue, health.damaged > 0 ? styles.repairable : undefined)}>{health.health}</span>
        </InfoPopup>
    );
};

/** The hull's shields as a bar, which opens a description of the shields, and what they'd do to a hit right now. */
const ShieldStat: FC<{ shield: ShieldInfo; power: number; reinforced: boolean }> = ({ shield, power, reinforced }) => (
    <InfoPopup
        className={classNames(styles.stat, styles.shieldStat)}
        palette="energy"
        name={`Shields (${shield.level}/${shield.max})`}
        ariaLabel={`Shields ${getShieldPercent(shield)}%`}
        description={(
            <>
                {`Protects the ship from damage. The shields absorb a share of each hit, which drains them. More hull power means they absorb more, for less drain. They collapse if a hit leaves them below ${shieldCollapsePercent}%, and recharge between encounters.`}
                {power > 0
                    ? ` At ${power} hull power${reinforced ? ', while reinforced' : ''}, they absorb ${getShieldAbsorption(power)}% of each hit, and are drained by ${getShieldDrainPercent(power, reinforced)}% of what they absorb.`
                    : ' The hull has no power, so they absorb nothing.'}
            </>
        )}
    >
        <ShieldsIcon className={styles.statIcon} />
        <ShieldBar shield={shield} className={styles.statBar} />
        <ShieldPercent shield={shield} className={styles.statValue} />
    </InfoPopup>
);

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
            <section className={styles.stats} aria-label="Status">
                <HealthStat health={props.health} />
                {props.shield && props.shield.max > 0 && <ShieldStat shield={props.shield} power={props.power} reinforced={props.shieldReinforced} />}
            </section>

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
