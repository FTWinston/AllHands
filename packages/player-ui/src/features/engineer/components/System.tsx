import { IArray } from '@colyseus/react';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemEffectInstance } from 'common-data/features/ships/types/SystemEffectDefinition';
import { Button } from 'common-ui/components/Button';
import { default as HealthIcon } from 'common-ui/icons/health.svg?react';
import { SystemIcon } from 'common-ui/icons/systems';
import { classNames } from 'common-ui/utils/classNames';
import { default as PowerIcon } from '../../header/assets/power.svg?react';
import { default as CardDrawIcon } from '../assets/card-draw.svg?react';
import { EffectList } from './EffectList';
import styles from './System.module.css';

export type SystemInfo = {
    system: ShipSystem;
    power: number;
    health: number;
    maxHealth: number;
    generating: boolean;
    effects?: IArray<SystemEffectInstance>;
};

type Props = SystemInfo & {
    /** Opens a view of all of this system's cards. */
    onViewCards: () => void;
};

export const System = (props: Props) => {
    return (
        <div className={styles.system}>
            <h2 className={styles.name}>
                <SystemIcon className={styles.nameIcon} system={props.system} />
                {props.system}
            </h2>

            {/* One grid, so the icons and values line up between the two. */}
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
            </div>

            <EffectList className={styles.effects} effects={props.effects} />

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
