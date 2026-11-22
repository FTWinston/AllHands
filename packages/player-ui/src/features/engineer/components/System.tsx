import { IArray } from '@colyseus/react';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemEffectInstance } from 'common-data/features/ships/types/SystemEffectDefinition';
import { HullSystemTileInfo } from 'common-data/features/space/types/GameObjectInfo';
import { default as HealthIcon } from 'common-ui/icons/health.svg?react';
import { ShieldsIcon, SystemIcon } from 'common-ui/icons/systems';
import { classNames } from 'common-ui/utils/classNames';
import { useId } from 'react';
import { default as PowerIcon } from '../../header/assets/power.svg?react';
import { default as CardDrawIcon } from '../assets/card-draw.svg?react';
import { EffectList } from './EffectList';
import { describeHealth, HealthBar, HealthBreakdown } from './HealthBar';
import { getShieldPercent, ShieldBar, ShieldInfo } from './ShieldBar';
import styles from './System.module.css';

export type SystemInfo = HealthBreakdown & {
    system: ShipSystem;
    power: number;
    generating: boolean;
    effects?: IArray<SystemEffectInstance>;
};

/** The hull's tile, which also has the hull's shields (see `isHullSystemTile`). */
export type HullSystemInfo = SystemInfo & Pick<HullSystemTileInfo, 'system' | 'shield' | 'maxShield'>;

type Props = SystemInfo & {
    /** The hull's shields, shown above its health, as they apply first. */
    shield?: ShieldInfo;
    /** Opens a view of all of this system's cards. */
    onViewCards: () => void;
};

/**
 * A system's tile on the engineer's screen, with its power (as a badge on its corner), health and effects, and for the hull, its shields.
 * Beneath the health bar, it shows the damage that can be repaired, with the same icon as the repair meter.
 * The whole tile is a button that opens the system's cards (where the health and shields are explained), apart from the effects, which open their own descriptions.
 */
export const System = (props: Props) => {
    const { shield, effects } = props;
    const healthId = useId();

    const hasShield = !!shield && shield.max > 0;

    return (
        <div className={classNames(styles.system, props.generating ? styles.generating : undefined)}>
            <h2 className={styles.name}>
                {/* Stretched over the whole tile (see the CSS), so tapping anywhere that isn't otherwise a button opens the cards. */}
                <button
                    type="button"
                    className={styles.viewCards}
                    onClick={props.onViewCards}
                    aria-label={`View ${props.system} cards`}
                    aria-describedby={healthId}
                >
                    <SystemIcon className={styles.nameIcon} system={props.system} />
                    {props.system}
                </button>
            </h2>

            {/* Sticks out of the tile's top right corner. */}
            <span className={classNames(styles.badge, styles.powerBadge)} role="img" aria-label={`Power ${props.power}`}>
                <PowerIcon className={styles.badgeIcon} />
                {props.power}
            </span>

            {/* An icon, a bar and a number each, sharing columns so they line up. */}
            <div className={styles.stats}>
                {/* Shields first, as they apply first. */}
                {hasShield && (
                    <div className={classNames(styles.stat, styles.shields)} role="img" aria-label={`Shields ${getShieldPercent(shield)}%`}>
                        <ShieldsIcon className={styles.icon} />
                        <ShieldBar shield={shield} />
                        <span className={styles.value}>
                            {getShieldPercent(shield)}
                            <span className={styles.max}>%</span>
                        </span>
                    </div>
                )}

                <div id={healthId} className={styles.stat} role="img" aria-label={describeHealth(props)}>
                    <HealthIcon className={styles.icon} />
                    <HealthBar health={props} showRepairable />
                    <span className={styles.value}>
                        {props.health}
                        <span className={styles.max}>{`/${props.maxHealth}`}</span>
                    </span>
                </div>
            </div>

            <EffectList className={styles.effects} effects={effects} />

            {/* Says that the tile opens its cards, and glows while the system's next card is being generated. */}
            <CardDrawIcon className={styles.cardsIcon} aria-hidden="true" />
        </div>
    );
};
