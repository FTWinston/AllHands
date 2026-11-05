import { toggleSoundEnabled, useSoundEnabled } from 'common-ui/features/sound/soundSettings';
import { FC } from 'react';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';

type Props = {
    resumeGame: () => void;
    disconnect: () => void;
};

export const InGameMenu: FC<Props> = (props) => {
    const soundEnabled = useSoundEnabled();

    return (
        <Menu heading="Game paused">
            <MenuItem
                text="Resume game"
                number={1}
                emphasis="primary"
                onClick={props.resumeGame}
            />

            <MenuItem
                text="Sound effects"
                description={soundEnabled ? 'On' : 'Off'}
                number={2}
                onClick={toggleSoundEnabled}
            />

            <MenuItem
                text="Disconnect"
                number={3}
                emphasis="danger"
                onClick={props.disconnect}
                confirmPrompt="Are you sure you want to disconnect?"
            />
        </Menu>
    );
};
