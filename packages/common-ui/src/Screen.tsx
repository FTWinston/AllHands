import { PropsWithChildren } from 'react';

import { classNames } from './classNames';
import styles from './Screen.module.css';

export type Props = {
    className?: string;
    centered?: true;
};

export const Screen: React.FC<PropsWithChildren<Props>> = (props) => (
    <main
        className={classNames(styles.screen, props.centered ? styles.centered : undefined, props.className)}
    >
        {props.children}
    </main>
);
