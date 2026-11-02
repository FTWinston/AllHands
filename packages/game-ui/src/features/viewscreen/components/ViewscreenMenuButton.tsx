import { Button } from 'common-ui/components/Button';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import styles from './ViewscreenMenuButton.module.css';

type Props = {
    showMenu: () => void;
    /** Sit in a top bar, rather than floating over the screen's top left corner. */
    inBar?: boolean;
};

export const ViewscreenMenuButton: FC<Props> = props => (
    <Button
        className={classNames(styles.menuButton, props.inBar ? styles.inBar : null)}
        title="Menu"
        onClick={props.showMenu}
    >
        <MenuIcon className={styles.menuButtonIcon} />
    </Button>
);
