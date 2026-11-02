import { toggleSoundEnabled, useSoundEnabled } from 'common-ui/features/sound/soundSettings';
import { FC } from 'react';
import { PlayIcon, PowerIcon, SoundIcon, SoundOffIcon } from 'src/icons';
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
                icon={<PlayIcon />}
                emphasis="primary"
                onClick={props.resumeGame}
            />

            <MenuItem
                text="Sound effects"
                description={soundEnabled ? 'On' : 'Off'}
                icon={soundEnabled ? <SoundIcon /> : <SoundOffIcon />}
                onClick={toggleSoundEnabled}
            />

            <MenuItem
                text="Disconnect"
                icon={<PowerIcon />}
                emphasis="danger"
                onClick={props.disconnect}
                confirmPrompt="Are you sure you want to disconnect?"
            />
        </Menu>
    );
};
