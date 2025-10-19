import { ShipSystem } from 'common-types';
import { SystemIcon } from 'common-ui/icons/systems';
import { classNames } from 'common-ui/index';
import { default as HealthIcon } from '../../header/assets/health.svg?react';
import { default as PowerIcon } from '../../header/assets/power.svg?react';
import { SystemEffect } from './EffectIndicator';
import { EffectList } from './EffectList';
import styles from './System.module.css';

export type SystemInfo = {
    system: ShipSystem;
    power: number;
    health: number;
    positiveEffects?: SystemEffect[];
    negativeEffects?: SystemEffect[];
};

type Props = SystemInfo;

export const System = (props: Props) => {
    return (
        <div className={styles.system}>
            <h2 className={styles.name}>{props.system}</h2>
            <SystemIcon
                system={props.system}
                className={styles.image}
            />
            <div className={classNames(styles.energy, styles.attribute)}>
                <PowerIcon className={styles.attributeIcon} />
                <div className={styles.attributeValue}>{props.power}</div>
            </div>
            <div className={classNames(styles.health, styles.attribute)}>
                <HealthIcon className={styles.attributeIcon} />
                <div className={styles.attributeValue}>{props.health}</div>
            </div>
            <EffectList className={styles.negativeEffects} effects={props.negativeEffects} isPositive={false} />
            <EffectList className={styles.positiveEffects} effects={props.positiveEffects} isPositive={true} />
        </div>
    );
};
