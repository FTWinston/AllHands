import { Menu } from '@base-ui-components/react/menu';
import { classNames } from 'common-ui/classNames';
import { FC } from 'react';
import { toggleFullscreen } from '../../../utils/fullscreen';
import styles from './CrewMenu.module.css';

type Props = {
    onPause: () => void;
};

export const CrewMenu: FC<Props> = (props) => {
    return (
        <Menu.Portal>
            <Menu.Positioner sideOffset={8}>
                <Menu.Popup className={styles.popup}>
                    <Menu.Arrow className={styles.arrow} />
                    <Menu.Item
                        className={classNames(styles.item, styles.fullscreenItem)}
                        onClick={toggleFullscreen}
                    >
                        Toggle full screen
                    </Menu.Item>
                    <Menu.Separator className={styles.separator} />
                    <Menu.Item
                        className={styles.item}
                        onClick={props.onPause}
                    >
                        Pause game
                    </Menu.Item>
                </Menu.Popup>
            </Menu.Positioner>
        </Menu.Portal>
    );
};
