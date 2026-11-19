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
import { getShieldPercent, ShieldInfo } from './ShieldBar';
import styles from './System.module.css';
import { TileShieldOutline } from './TileShieldOutline';

export type SystemInfo = HealthBreakdown & {
    system: ShipSystem;
    power: number;
    generating: boolean;
    effects?: IArray<SystemEffectInstance>;
};

/** The hull's tile, which also has the hull's shields (see `isHullSystemTile`). */
export type HullSystemInfo = SystemInfo & Pick<HullSystemTileInfo, 'system' | 'shield' | 'maxShield'>;

type Props = SystemInfo & {
    /** The hull's shields, shown as a dotted outline around the tile, and beside its name. */
    shield?: ShieldInfo;
    /** Opens a view of all of this system's cards. */
    onViewCards: () => void;
};

/** Power is shown out of this, though effects can take it higher. */
const basePowerMax = 5;

/**
 * A system's tile on the engineer's screen, with its power, health (one segment per card) and effects.
 * The whole tile is a button that opens the system's cards (where the health and shields are explained), apart from the effects, which open their own descriptions.
 */
export const System = (props: Props) => {
    const { shield, effects } = props;
    const healthId = useId();

    const hasShield = !!shield && shield.max > 0;
    const powerPips = Math.max(basePowerMax, props.power);

    return (
        <div className={classNames(styles.system, hasShield ? styles.shielded : undefined, props.generating ? styles.generating : undefined)}>
            {hasShield && <TileShieldOutline level={getShieldPercent(shield)} />}

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

            {/* In the top right, beside the name, as there's no room for a row of its own. Its outline is the tile's own, dotted. */}
            {hasShield && (
                <span className={styles.shieldIndicator} role="img" aria-label={`Shields ${getShieldPercent(shield)}%`}>
                    <ShieldsIcon className={styles.shieldIcon} />
                    {/* A percentage, but there's no room for the sign. */}
                    {getShieldPercent(shield)}
                </span>
            )}

            <div className={styles.rows}>
                <div className={styles.row} role="img" aria-label={`Power ${props.power} of ${basePowerMax}`}>
                    <PowerIcon className={styles.icon} />
                    <span className={styles.powerPips}>
                        {Array.from({ length: powerPips }, (_, index) => (
                            <span key={index} className={classNames(styles.pip, index < props.power ? styles.powered : undefined)} />
                        ))}
                    </span>
                    <span className={styles.value}>{props.power}</span>
                </div>

                <div id={healthId} className={styles.row} role="img" aria-label={describeHealth(props)}>
                    <HealthIcon className={styles.icon} />
                    <HealthBar health={props} />
                    {/* Red when there's damage to repair. */}
                    <span className={classNames(styles.value, props.damaged > 0 ? styles.repairable : undefined)}>
                        {props.health}
                    </span>
                </div>
            </div>

            <EffectList className={styles.effects} effects={effects} />

            {/* Says that the tile opens its cards, and glows while the system's next card is being generated. */}
            <CardDrawIcon className={styles.cardsIcon} aria-hidden="true" />
        </div>
    );
};
