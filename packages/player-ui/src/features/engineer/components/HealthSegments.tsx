import { classNames } from 'common-ui/utils/classNames';
import styles from './HealthSegments.module.css';

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
};

/** One per card, in the order they're shown: working, stabilised, damaged, critically damaged. */
function getSegmentStates(health: HealthBreakdown): SegmentState[] {
    return [
        ...Array<SegmentState>(Math.max(0, health.health - health.stabilised)).fill('healthy'),
        ...Array<SegmentState>(health.stabilised).fill('stabilised'),
        ...Array<SegmentState>(health.damaged).fill('damaged'),
        ...Array<SegmentState>(health.critical).fill('critical'),
    ];
}

/**
 * A system's health as a bar of segments, one per card, showing which can be repaired and which can't. Decorative: describe it with `describeHealth`.
 * Working cards are filled (healthy, then stabilised) and broken ones are empty (damaged, then critically damaged).
 */
export const HealthSegments = (props: Props) => (
    <span className={classNames(styles.segments, props.className)} aria-hidden="true">
        {getSegmentStates(props.health).map((state, index) => <HealthSegment key={index} state={state} />)}
    </span>
);

/** A single card's segment, also used as a swatch beside a description of what it means. */
export const HealthSegment = (props: { state: SegmentState; className?: string }) => (
    <span className={classNames(styles.segment, styles[props.state], props.className)} aria-hidden="true" />
);
