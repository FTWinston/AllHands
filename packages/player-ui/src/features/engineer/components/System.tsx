import { ShipSystem } from 'common-types';
import { SystemIcon } from 'common-ui/icons/systems';
import { default as HealthIcon } from '../../header/assets/health.svg?react';
import { default as PowerIcon } from '../../header/assets/power.svg?react';
import { SystemEffect } from './EffectIndicator';
import { EffectList } from './EffectList';
import styles from './System.module.css';

export type SystemInfo = {
    system: ShipSystem;
    power: number;
    health: number;
    effects?: SystemEffect[];
};

type Props = SystemInfo;

export const System = (props: Props) => {
    return (
        <div className={styles.system}>
            <h2 className={styles.name}>
                <SystemIcon
                    system={props.system}
                    className={styles.image}
                />

                {props.system}
            </h2>

            <div className={styles.attributes}>
                <div className={styles.attribute}>
                    <PowerIcon className={styles.attributeIcon} />
                    <div className={styles.attributeValue}>{props.power}</div>
                    <div className={styles.attributeMax}>/ 5</div>
                </div>
                <div className={styles.attribute}>
                    <HealthIcon className={styles.attributeIcon} />
                    <div className={styles.attributeValue}>{props.health}</div>
                    <div className={styles.attributeMax}>/ 5</div>
                </div>
            </div>

            <EffectList className={styles.effects} effects={props.effects} />
        </div>
    );
};
