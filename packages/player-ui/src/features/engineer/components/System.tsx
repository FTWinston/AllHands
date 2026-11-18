import { IArray } from '@colyseus/react';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemEffectInstance } from 'common-data/features/ships/types/SystemEffectDefinition';
import { getShieldAbsorption, getShieldDrainPercent, shieldCollapsePercent } from 'common-data/features/ships/utils/shieldStats';
import { HullSystemTileInfo } from 'common-data/features/space/types/GameObjectInfo';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { default as HealthIcon } from 'common-ui/icons/health.svg?react';
import { ShieldsIcon, SystemIcon } from 'common-ui/icons/systems';
import { classNames } from 'common-ui/utils/classNames';
import { useId } from 'react';
import { default as PowerIcon } from '../../header/assets/power.svg?react';
import { default as CardDrawIcon } from '../assets/card-draw.svg?react';
import { EffectList } from './EffectList';
import { describeHealth, HealthBreakdown, HealthSegments } from './HealthSegments';
import styles from './System.module.css';

export type SystemInfo = HealthBreakdown & {
    system: ShipSystem;
    power: number;
    generating: boolean;
    effects?: IArray<SystemEffectInstance>;
};

/** The hull's tile, which also has the hull's shields (see `isHullSystemTile`). */
export type HullSystemInfo = SystemInfo & Pick<HullSystemTileInfo, 'system' | 'shield' | 'maxShield'>;

export type TileShieldInfo = {
    level: number;
    max: number;
};

type Props = SystemInfo & {
    /** The hull's shields, shown with power and health. */
    shield?: TileShieldInfo;
    /** Opens a view of all of this system's cards. */
    onViewCards: () => void;
};

/** Power is shown out of this, though effects can take it higher. */
const basePowerMax = 5;

type ShieldRowProps = TileShieldInfo & {
    /** The hull's power level, which sets how much the shields absorb, and how much that drains them. */
    power: number;
    reinforced: boolean;
};

/** The hull's shields, as a bar, which opens a description of the shields, and what they'd do to a hit right now. */
const ShieldRow = (props: ShieldRowProps) => (
    <InfoPopup
        className={classNames(styles.row, styles.shieldRow)}
        name={`Shields (${props.level}/${props.max})`}
        ariaLabel={`Shields ${props.level} of ${props.max}`}
        description={(
            <>
                {`Protects the ship from damage. The shields absorb a share of each hit, which drains them. More hull power means they absorb more, for less drain. They collapse if a hit leaves them below ${shieldCollapsePercent}%, and recharge between encounters.`}
                {props.power > 0
                    ? ` At ${props.power} hull power${props.reinforced ? ', while reinforced' : ''}, they absorb ${getShieldAbsorption(props.power)}% of each hit, and are drained by ${getShieldDrainPercent(props.power, props.reinforced)}% of what they absorb.`
                    : ' The hull has no power, so they absorb nothing.'}
            </>
        )}
    >
        <ShieldsIcon className={styles.icon} />
        <span className={styles.shieldBar}>
            <span className={styles.shieldFill} style={{ width: `${props.max > 0 ? props.level / props.max * 100 : 0}%` }} />
        </span>
        <span className={styles.value}>{props.level}</span>
    </InfoPopup>
);

/**
 * A system's tile on the engineer's screen, with its power, health (one segment per card) and effects.
 * The whole tile is a button that opens the system's cards, apart from the effects and shields, which open their own descriptions.
 */
export const System = (props: Props) => {
    const { shield, effects } = props;
    const healthId = useId();

    const hasShield = !!shield && shield.max > 0;
    const powerPips = Math.max(basePowerMax, props.power);

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
                    <HealthSegments health={props} />
                    <span className={classNames(styles.value, props.health < props.maxHealth ? styles.lowHealth : undefined, props.health <= 0 ? styles.noHealth : undefined)}>
                        {props.health}
                    </span>
                </div>

                {hasShield && (
                    <ShieldRow
                        {...shield}
                        power={props.power}
                        reinforced={effects?.some(effect => effect.type === 'shieldReinforced') === true}
                    />
                )}
            </div>

            <EffectList className={styles.effects} effects={effects} />

            {/* Says that the tile opens its cards, and glows while the system's next card is being generated. */}
            <CardDrawIcon className={styles.cardsIcon} aria-hidden="true" />
        </div>
    );
};
