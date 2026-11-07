import { FC } from 'react';
import { ObjectIcon } from '..';
import { classNames } from '../../utils/classNames';
import styles from './ShieldedObjectIcon.module.css';
import { getShieldDotPattern, getShieldPath, shieldDotSize, shieldTrackDasharray } from './shieldOutline';
import type { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';

type ShieldOutlineProps = {
    appearance: ObjectAppearance;
    /** Shield strength, 0-100. */
    level: number;
    className?: string;
};

/**
 * A dotted line around a ship, lit for the share of its shields that remain, draining from the back to the nose.
 * It covers its positioned parent, to line up with an ObjectIcon that fills it, and reaches up to `shieldOverhang` outside it.
 */
const ShieldOutline: FC<ShieldOutlineProps> = ({ appearance, level, className }) => {
    const path = getShieldPath(appearance);
    if (!path) {
        return null;
    }

    const pattern = getShieldDotPattern(level);

    return (
        <svg
            className={classNames(styles.shield, className)}
            viewBox="0 0 512 512"
            fill="none"
            stroke="currentColor"
            strokeWidth={shieldDotSize}
            strokeLinecap="round"
            aria-hidden={true}
        >
            <path className={styles.track} d={path} pathLength={100} strokeDasharray={shieldTrackDasharray} />
            {pattern && (
                <path d={path} pathLength={100} strokeDasharray={pattern.dasharray} strokeDashoffset={pattern.dashoffset} />
            )}
        </svg>
    );
};

type Props = {
    appearance: ObjectAppearance;
    /** Shield strength, 0-100, or null to show no shield outline. */
    shield: number | null;
    /** Sizes the icon, which fills it. */
    className?: string;
};

/** An object's icon, with its shield outline over it when its shields are known. */
export const ShieldedObjectIcon: FC<Props> = ({ appearance, shield, className }) => (
    <div className={classNames(styles.root, className)}>
        <ObjectIcon appearance={appearance} className={styles.icon} />
        {shield !== null && <ShieldOutline appearance={appearance} level={shield} />}
    </div>
);
