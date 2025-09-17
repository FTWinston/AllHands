import styles from './Menu.module.css';

type Props = {
    title: string;
};

export const Menu: React.FC<React.PropsWithChildren<Props>> = (props) => (
    <>
        <h1 className={styles.title}>{props.title}</h1>
        <nav className={styles.menuRoot}>
            <ul className={styles.menuList}>
                {props.children}
            </ul>
        </nav>
    </>
);
