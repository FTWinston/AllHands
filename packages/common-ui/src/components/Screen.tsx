import { FC, PropsWithChildren } from 'react';

import { classNames } from '../utils/classNames';
import styles from './Screen.module.css';

export type Props = {
    className?: string;
    centered?: true;
    padded?: true;
};

export const Screen: FC<PropsWithChildren<Props>> = props => (
    <main
        className={classNames(styles.screen, props.centered ? styles.centered : undefined, props.padded ? styles.padded : undefined, props.className)}
    >
        {props.children}
    </main>
);
