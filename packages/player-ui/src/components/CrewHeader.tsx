import { Menu } from '@base-ui-components/react/menu';
import { CrewRoleName } from 'common-types';
import { Button } from 'common-ui/Button';
import { classNames } from 'common-ui/classNames';
import { CrewIcon } from 'common-ui/icons/crew';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { FC } from 'react';
import { toggleFullscreen } from '../utils/fullscreen';
import styles from './CrewHeader.module.css';

type Props = {
    crew: CrewRoleName;
    onPause: () => void;
};

export const CrewHeader: FC<Props> = (props) => {
    return (
        <div className={styles.crewHeader}>

            <Menu.Root>
                <Menu.Trigger render={(
                    <Button className={styles.menuButton}>
                        <MenuIcon className={styles.menuButtonIcon} />
                    </Button>
                )}
                >
                </Menu.Trigger>
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
            </Menu.Root>

            <CrewIcon crew={props.crew} className={styles.crewIcon} />

            hi
            {' '}
            {props.crew}
        </div>
    );
};
