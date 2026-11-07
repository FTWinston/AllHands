import { FC } from 'react';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';

type Props = {
    resumeGame: () => void;
    showSettings: () => void;
    disconnect: () => void;
};

export const InGameMenu: FC<Props> = props => (
    <Menu heading="Game paused">
        <MenuItem
            text="Resume game"
            number={1}
            emphasis="primary"
            onClick={props.resumeGame}
        />

        <MenuItem
            text="Settings"
            number={2}
            onClick={props.showSettings}
        />

        <MenuItem
            text="Quit to menu"
            number={3}
            emphasis="danger"
            onClick={props.disconnect}
            confirmPrompt="Are you sure you want to quit to the main menu?"
        />
    </Menu>
);
