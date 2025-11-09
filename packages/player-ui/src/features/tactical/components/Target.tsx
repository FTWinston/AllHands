import { ShipAppearance } from 'common-types';
import { classNames } from 'common-ui/classNames';
import colorPalettes from 'common-ui/ColorPalette.module.css';
import { ShipIcon } from 'common-ui/icons/ships';
import styles from './Target.module.css';

export type TargetInfo = {
    id: string;
    appearance: ShipAppearance;
};

type Props = TargetInfo & {
    targetNumber: number;
    totalTargets: number;
};

export const Target = (props: Props) => {
    return (
        <div className={classNames(styles.target, colorPalettes.primary)}>
            <h2 className={styles.name}>{props.id}</h2>
            <div className={styles.count}>
                #
                {' '}
                {props.targetNumber}
                {' '}
                /
                {' '}
                {props.totalTargets}
            </div>
            <ShipIcon
                appearance={props.appearance}
                className={styles.image}
            />
        </div>
    );
};
