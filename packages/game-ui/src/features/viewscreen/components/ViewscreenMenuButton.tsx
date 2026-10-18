import { Button } from 'common-ui/components/Button';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { FC } from 'react';
import styles from './ViewscreenMenuButton.module.css';

type Props = {
    showMenu: () => void;
};

export const ViewscreenMenuButton: FC<Props> = props => (
    <Button
        className={styles.menuButton}
        title="Menu"
        onClick={props.showMenu}
    >
        <MenuIcon className={styles.menuButtonIcon} />
    </Button>
);
