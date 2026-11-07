import { toggleSoundEnabled, useSoundEnabled } from 'common-ui/features/sound/soundSettings';
import { FC } from 'react';
import { toggleCombatLabels, toggleShakeAndFlashes, useCombatLabels, useShakeAndFlashes } from '../../viewscreen/utils/combatEffectSettings';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';

type Props = {
    back: () => void;
};

export const SettingsMenu: FC<Props> = (props) => {
    const soundEnabled = useSoundEnabled();
    const combatLabels = useCombatLabels();
    const shakeAndFlashes = useShakeAndFlashes();

    return (
        <Menu heading="Settings">
            <MenuItem
                text="Sound effects"
                toggledOn={soundEnabled}
                number={1}
                onClick={toggleSoundEnabled}
            />

            <MenuItem
                text="Combat labels"
                toggledOn={combatLabels}
                number={2}
                onClick={toggleCombatLabels}
            />

            <MenuItem
                text="Shake and flashes"
                toggledOn={shakeAndFlashes}
                number={3}
                onClick={toggleShakeAndFlashes}
            />

            <MenuItem
                text="Go back"
                number={4}
                onClick={props.back}
            />
        </Menu>
    );
};
