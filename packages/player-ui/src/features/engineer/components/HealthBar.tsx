import { classNames } from 'common-ui/utils/classNames';
import { PropsWithChildren } from 'react';
import { default as RepairIcon } from '../assets/repair.svg?react';
import styles from './HealthBar.module.css';

/** A system's health, broken down by what's happened to its cards. */
export type HealthBreakdown = {
    /** How many of the system's cards work, including stabilised ones. */
    health: number;
    maxHealth: number;
    /** How much of the health is from stabilised cards, which are critically damaged if damaged again. */
    stabilised: number;
    /** Damaged cards, which can be repaired. */
    damaged: number;
    /** Critically damaged cards, which can't be repaired. */
    critical: number;
};

export type SegmentState = 'healthy' | 'stabilised' | 'damaged' | 'critical';

export function describeHealth(health: HealthBreakdown) {
    const parts = [
        health.stabilised > 0 ? `${health.stabilised} stabilised, so critically damaged if damaged again` : null,
        health.damaged > 0 ? `${health.damaged} damaged, which can be repaired` : null,
        health.critical > 0 ? `${health.critical} critically damaged, which can't be repaired` : null,
    ].filter(part => part !== null);

    return `Health ${health.health} of ${health.maxHealth}${parts.length > 0 ? `: ${parts.join('; ')}` : ''}`;
}

type Props = {
    health: HealthBreakdown;
    className?: string;
    /** Show the number of damaged cards (which can be repaired), when there are any, beneath their section. */
    showRepairable?: boolean;
};

/** The bar's sections, in the order they're shown. */
const sectionStates: SegmentState[] = ['healthy', 'stabilised', 'damaged', 'critical'];

function getSectionCounts(health: HealthBreakdown): Record<SegmentState, number> {
    return {
        healthy: Math.max(0, health.health - health.stabilised),
        stabilised: health.stabilised,
        damaged: health.damaged,
        critical: health.critical,
    };
}

/**
 * A system's health as a continuous bar, showing which of its damage can be repaired and which can't. Decorative: describe it with `describeHealth`.
 * Its sections are sized by their number of cards: filled for healthy cards, half filled for stabilised ones,
 * empty for damaged ones (which can be repaired), and red for critically damaged ones (which can't).
 */
export const HealthBar = (props: Props) => {
    const counts = getSectionCounts(props.health);
    const states = sectionStates.filter(state => counts[state] > 0);

    const bar = (
        <span className={classNames(styles.bar, props.showRepairable ? undefined : props.className)} aria-hidden="true">
            {states.map(state => (
                <span
                    key={state}
                    className={classNames(styles.section, styles[state])}
                    // @ts-expect-error CSS custom property
                    style={{ '--count': counts[state] }}
                />
            ))}
        </span>
    );

    if (!props.showRepairable) {
        return bar;
    }

    // The damage that can be repaired, with the repair icon, as on the repair meter, centred beneath its section, so it moves with it.
    // The other sections have gaps beneath them, to keep it in place.
    const working = counts.healthy + counts.stabilised;

    return (
        <span className={classNames(styles.withRepairable, props.className)} aria-hidden="true">
            {bar}
            {counts.damaged > 0 && (
                <span className={styles.beneath}>
                    {working > 0 && <Beneath count={working} />}
                    <Beneath count={counts.damaged} className={styles.repairable}>
                        <RepairIcon className={styles.repairIcon} />
                        {counts.damaged}
                    </Beneath>
                    {counts.critical > 0 && <Beneath count={counts.critical} />}
                </span>
            )}
        </span>
    );
};

/** Beneath the bar, as wide as the sections it's for, or just taking up their space if it's empty. */
const Beneath = (props: PropsWithChildren<{ count: number; className?: string }>) => (
    <span
        className={classNames(styles.beneathSection, props.className)}
        // @ts-expect-error CSS custom property
        style={{ '--count': props.count }}
    >
        {props.children}
    </span>
);

/** A single section's look, as a swatch beside a description of what it means. */
export const HealthSwatch = (props: { state: SegmentState; className?: string }) => (
    <span className={classNames(styles.swatch, props.className)} aria-hidden="true">
        <span className={classNames(styles.section, styles[props.state])} />
    </span>
);
