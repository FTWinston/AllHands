import { Menu } from '@base-ui/react/menu';
import { Button } from 'common-ui/components/Button';
import { toggleSoundEnabled, useSoundEnabled } from 'common-ui/features/sound/soundSettings';
import { default as MenuIcon } from 'common-ui/icons/hamburger-menu.svg?react';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import { toggleFullscreen } from '../../../utils/fullscreen';
import styles from './CrewMenu.module.css';

type Props = {
    onPause: () => void;
};

/** The crew header's menu button. */
export const CrewMenu: FC<Props> = (props) => {
    const soundEnabled = useSoundEnabled();

    return (
        <Menu.Root>
            <Menu.Trigger
                render={(
                    <Button className={styles.menuButton} title="Menu">
                        <MenuIcon className={styles.menuButtonIcon} />
                    </Button>
                )}
            />
            <Menu.Portal>
                <Menu.Backdrop className={styles.backdrop} />
                <Menu.Positioner className={styles.positioner} sideOffset={8}>
                    <Menu.Popup className={styles.popup}>
                        <Menu.Arrow className={styles.arrow} />
                        <Menu.Item
                            className={classNames(styles.item, styles.fullscreenItem)}
                            onClick={toggleFullscreen}
                        >
                            Toggle full screen
                        </Menu.Item>
                        <Menu.Item
                            className={classNames(styles.item, styles.toggleItem)}
                            data-checked={soundEnabled || undefined}
                            onClick={toggleSoundEnabled}
                        >
                            Sound effects
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
    );
};
