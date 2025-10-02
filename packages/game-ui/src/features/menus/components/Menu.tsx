import { FC, PropsWithChildren } from 'react';
import styles from './Menu.module.css';

type Props = {
    title: string;
};

export const Menu: FC<PropsWithChildren<Props>> = props => (
    <>
        <h1 className={styles.title}>{props.title}</h1>
        <nav className={styles.menuRoot}>
            <ul className={styles.menuList}>
                {props.children}
            </ul>
        </nav>
    </>
);
