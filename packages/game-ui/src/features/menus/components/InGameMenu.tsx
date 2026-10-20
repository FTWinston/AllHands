import { Screen } from 'common-ui/components/Screen';
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
        <Screen padded>
            <Menu title="All Hands">
                <MenuItem
                    text="Resume game"
                    onClick={props.resumeGame}
                />

                <MenuItem
                    text={soundEnabled ? 'Sound effects: on' : 'Sound effects: off'}
                    onClick={toggleSoundEnabled}
                />

                <MenuItem
                    text="Disconnect"
                    onClick={props.disconnect}
                    confirmPrompt="Are you sure you want to disconnect?"
                />
            </Menu>
        </Screen>
    );
};
