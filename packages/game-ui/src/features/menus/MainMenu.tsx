import styles from "./MainMenu.module.css";

type Props = {
    hostServer: () => void;
    joinServer: () => void;
    quit: () => void;
};

export const MainMenu: React.FC<Props> = (props) => {
    return (
        <main>
            <h1 className={styles.title}>Make It So</h1>
            <nav>
                <ul className={styles.menuList}>
                    <li>
                        <button
                            className={styles.menuItem}
                            onClick={props.hostServer}
                        >
                            Host game
                        </button>
                    </li>

                    <li>
                        <button
                            className={styles.menuItem}
                            onClick={props.joinServer}
                        >
                            Join game
                        </button>
                    </li>

                    <li>
                        <button
                            className={styles.menuItem}
                            onClick={props.quit}
                        >
                            Quit
                        </button>
                    </li>
                </ul>
            </nav>
        </main>
    );
};
