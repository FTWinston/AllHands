import { systemEffectDefinitions } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { Cooldown } from 'common-data/types/Cooldown';
import { RadialProgress } from 'common-ui/components/RadialProgress';
import { classNames } from 'common-ui/utils/classNames';
import styles from './MomentumReadout.module.css';

/** The most Momentum a helm can hold. */
export const maxMomentum = systemEffectDefinitions.momentum.maxLevel;

type Props = {
    className?: string;
    /** How many levels of Momentum the ship has. */
    level: number;
    /** When the ship next loses a level, if it's sitting still. */
    fade?: Cooldown | null;
};

/**
 * Shows how many levels of Momentum the ship has, in pips. While it has any, a ring around the readout is full for as long as the ship is moving,
 * and drains as the ship sits still, until it loses a level.
 */
export const MomentumReadout = (props: Props) => {
    const level = Math.max(0, Math.min(maxMomentum, Math.floor(props.level)));

    return (
        <div
            className={classNames(styles.momentum, level > 0 ? styles.active : null, props.className)}
            role="img"
            aria-label={`Momentum ${level} of ${maxMomentum}`}
        >
            {level > 0 && (
                <RadialProgress
                    className={styles.fade}
                    progress={props.fade}
                    visualAdjustment={fraction => 1 - fraction}
                    title="Time until Momentum is lost"
                />
            )}
            <span className={styles.label}>Momentum</span>
            <span className={styles.pips}>
                {new Array<number>(maxMomentum).fill(0).map((_, index) => (
                    <span key={index} className={index < level ? styles.pipFilled : styles.pip}>{index < level ? '●' : '○'}</span>
                ))}
            </span>
        </div>
    );
};
