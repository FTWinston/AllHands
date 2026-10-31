import { default as AntimatterIcon } from 'common-ui/icons/antimatter.svg?react';
import { FC } from 'react';
import styles from './AntimatterAmount.module.css';

type Props = {
    amount: number;
};

/** An amount of antimatter within text, as the number followed by the antimatter symbol, which is read as "antimatter". */
export const AntimatterAmount: FC<Props> = ({ amount }) => (
    <span className={styles.amount}>
        {amount}
        <AntimatterIcon className={styles.icon} role="img" aria-label="antimatter" />
    </span>
);
