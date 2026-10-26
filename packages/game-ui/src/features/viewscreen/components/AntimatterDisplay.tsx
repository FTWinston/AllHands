import { default as AntimatterIcon } from 'common-ui/icons/antimatter.svg?react';
import { FC } from 'react';
import styles from './AntimatterDisplay.module.css';

type Props = {
    antimatter: number;
};

/** How much antimatter the ship has to spend, shown in the corner of the viewscreen. */
export const AntimatterDisplay: FC<Props> = ({ antimatter }) => (
    <div className={styles.antimatter} role="status" aria-label={`Antimatter: ${antimatter}`}>
        <AntimatterIcon className={styles.icon} />
        <span className={styles.label}>Antimatter</span>
        <span className={styles.amount}>{antimatter}</span>
    </div>
);
