import { toggleSoundEnabled, useSoundEnabled } from 'common-ui/features/sound/soundSettings';
import { FC } from 'react';
import { toggleCombatLabels, useCombatLabels } from '../../viewscreen/utils/combatLabelSettings';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';

type Props = {
    resumeGame: () => void;
    disconnect: () => void;
};

export const InGameMenu: FC<Props> = (props) => {
    const soundEnabled = useSoundEnabled();
    const combatLabels = useCombatLabels();

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
                text="Combat labels"
                description={combatLabels ? 'On' : 'Off'}
                number={3}
                onClick={toggleCombatLabels}
            />

            <MenuItem
                text="Disconnect"
                number={4}
                emphasis="danger"
                onClick={props.disconnect}
                confirmPrompt="Are you sure you want to disconnect?"
            />
        </Menu>
    );
};
