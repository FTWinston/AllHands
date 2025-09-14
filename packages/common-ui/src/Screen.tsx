import { PropsWithChildren } from 'react';

import styles from './Screen.module.css';

export type Props = {
    className?: string;
    centered?: true;
};

export const Screen: React.FC<PropsWithChildren<Props>> = (props) => {
    let classNames = styles.screen;

    if (props.centered) {
        classNames += ' ' + styles.centered;
    }

    if (props.className) {
        classNames += ' ' + props.className;
    }

    return <main className={classNames}>{props.children}</main>;
};
