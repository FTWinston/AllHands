import { IArray } from '@colyseus/react';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemEffectInstance } from 'common-data/features/ships/types/SystemEffectDefinition';
import { getShieldAbsorption, getShieldDrainPercent } from 'common-data/features/ships/utils/shieldStats';
import { HullSystemTileInfo } from 'common-data/features/space/types/GameObjectInfo';
import { Button } from 'common-ui/components/Button';
import { EffectLevelContext } from 'common-ui/components/EffectLevelContext';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { default as HealthIcon } from 'common-ui/icons/health.svg?react';
import { ShieldsIcon, SystemIcon } from 'common-ui/icons/systems';
import { classNames } from 'common-ui/utils/classNames';
import { getSystemEffectDefinition } from 'common-ui/utils/getUiSystemEffectDefinition.js';
import { PropsWithChildren } from 'react';
import { default as PowerIcon } from '../../header/assets/power.svg?react';
import { default as CardDrawIcon } from '../assets/card-draw.svg?react';
import { EffectList } from './EffectList';
import styles from './System.module.css';
import { TileShieldOutline } from './TileShieldOutline';

export type SystemInfo = {
    system: ShipSystem;
    power: number;
    health: number;
    maxHealth: number;
    generating: boolean;
    effects?: IArray<SystemEffectInstance>;
};

/** The hull's tile, which also has the hull's shield capacity (see `isHullSystemTile`). */
export type HullSystemInfo = SystemInfo & Pick<HullSystemTileInfo, 'system' | 'maxShield'>;

export type TileShieldInfo = {
    level: number;
    max: number;
};

type Props = SystemInfo & {
    /** The hull's shields, shown along the tile's border and with its name or stats, instead of as an effect. */
    shield?: TileShieldInfo;
    /** Opens a view of all of this system's cards. */
    onViewCards: () => void;
};

type ShieldReadoutProps = PropsWithChildren<TileShieldInfo & {
    className: string;
    /** The hull's power level, which sets how much the shields absorb, and how much that drains them. */
    power: number;
    reinforced: boolean;
}>;

/** One of the tile's shield readouts, which opens a description of the shields, and what they'd do to a hit right now. */
const ShieldReadout = (props: ShieldReadoutProps) => {
    const definition = getSystemEffectDefinition('shield');

    return (
        <InfoPopup
            className={classNames(styles.shieldReadout, props.className)}
            name={`${definition.name} (${props.level}/${props.max})`}
            description={(
                <EffectLevelContext.Provider value={{ level: props.level, maxLevel: props.max, category: definition.category }}>
                    {definition.description}
                    {props.power > 0
                        ? ` At ${props.power} hull power${props.reinforced ? ', while reinforced' : ''}, they absorb ${getShieldAbsorption(props.power)}% of each hit, and are drained by ${getShieldDrainPercent(props.power, props.reinforced)}% of what they absorb.`
                        : ' The hull has no power, so they absorb nothing.'}
                </EffectLevelContext.Provider>
            )}
        >
            {props.children}
        </InfoPopup>
    );
};

export const System = (props: Props) => {
    const { shield } = props;
    const effects = shield ? props.effects?.filter(effect => effect.type !== 'shield') : props.effects;

    const hasShield = !!shield && shield.max > 0;
    const shieldReadout = hasShield
        ? { ...shield, power: props.power, reinforced: effects?.some(effect => effect.type === 'shieldReinforced') === true }
        : undefined;

    return (
        <div className={classNames(styles.system, hasShield ? styles.shielded : undefined)}>
            {hasShield && <TileShieldOutline level={shield.level / shield.max * 100} />}

            <div className={styles.header}>
                <h2 className={styles.name}>
                    <SystemIcon className={styles.nameIcon} system={props.system} />
                    {props.system}
                </h2>

                {/* Narrower tiles show the shields beside the name, and wide ones show them with power and health. */}
                {shieldReadout && (
                    <ShieldReadout {...shieldReadout} className={styles.headerShield}>
                        <span className={styles.headerShieldValue}>{shieldReadout.level}</span>
                        <span>
                            /
                            {shieldReadout.max}
                        </span>
                    </ShieldReadout>
                )}
            </div>

            {/* One grid, so the icons and values line up between them. */}
            <div className={styles.attributes}>
                <div className={classNames(styles.attribute, styles.power)}>
                    <PowerIcon className={styles.attributeIcon} />
                    <div className={styles.attributeValue}>{props.power}</div>
                    <div className={classNames(styles.attributeMax, styles.powerMax)}>/ 5</div>
                </div>
                <div className={classNames(styles.attribute, styles.health)}>
                    <HealthIcon className={styles.attributeIcon} />
                    <div className={classNames(styles.attributeValue, props.health < props.maxHealth ? styles.lowHealth : undefined, props.health <= 0 ? styles.noHealth : undefined)}>{props.health}</div>
                    <div className={styles.attributeMax}>
                        /
                        {' '}
                        {props.maxHealth}
                    </div>
                </div>
                {shieldReadout && (
                    <ShieldReadout {...shieldReadout} className={styles.shieldAttribute}>
                        <ShieldsIcon className={classNames(styles.attributeIcon, styles.shieldIcon)} />
                        <div className={classNames(styles.attributeValue, styles.shieldValue)}>{shieldReadout.level}</div>
                        <div className={styles.attributeMax}>
                            /
                            {' '}
                            {shieldReadout.max}
                        </div>
                    </ShieldReadout>
                )}
            </div>

            <EffectList className={styles.effects} effects={effects} />

            {/* Lights up while this system's next card is being generated. */}
            <Button
                outlined
                className={classNames(styles.viewCards, props.generating ? styles.generating : undefined)}
                startIcon={<CardDrawIcon />}
                onClick={props.onViewCards}
                aria-label={`View ${props.system} cards`}
                title={`View ${props.system} cards`}
            >
                <span className={styles.viewCardsLabel}>Cards</span>
            </Button>
        </div>
    );
};
