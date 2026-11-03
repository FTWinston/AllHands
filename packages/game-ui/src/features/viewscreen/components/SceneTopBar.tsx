import { FC } from 'react';
import { TopBar } from 'src/components/TopBar';
import { AntimatterDisplay } from './AntimatterDisplay';
import styles from './SceneTopBar.module.css';
import { ViewscreenMenuButton } from './ViewscreenMenuButton';

type Props = {
    /** A small line above the title, e.g. which sector this is. */
    subtitle: string;
    title: string;
    /** The ship's antimatter. Omitted when unknown. */
    antimatter?: number;
    /** Omitted where there's no menu to show, e.g. in stories. */
    showMenu?: () => void;
};

/** The top bar of a viewscreen scene between fights, such as the sector map: the menu button, where the ship is, and its antimatter. */
export const SceneTopBar: FC<Props> = ({ subtitle, title, antimatter, showMenu }) => (
    <TopBar
        start={showMenu && <ViewscreenMenuButton showMenu={showMenu} inBar />}
        end={antimatter !== undefined && <AntimatterDisplay antimatter={antimatter} />}
    >
        <div className={styles.header}>
            <p className={styles.subtitle}>{subtitle}</p>
            <h1 className={styles.title}>{title}</h1>
        </div>
    </TopBar>
);
