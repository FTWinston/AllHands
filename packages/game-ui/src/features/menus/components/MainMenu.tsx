import { FC } from 'react';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';

/** Shown on the main menu. There are no numbered releases yet. */
const gameVersion = 'Pre-alpha';

type Props = {
    hostSingleCrewServer: () => void;
    hostMultiCrewServer: () => void;
    joinMultiCrewServer: () => void;
    showCardCompendium: () => void;
    quit: () => void;
};

export const MainMenu: FC<Props> = (props) => {
    return (
        <Menu footer={`Version: ${gameVersion}`}>
            <MenuItem
                text="Start single-crew game"
                number={1}
                emphasis="primary"
                onClick={props.hostSingleCrewServer}
            />

            <MenuItem
                text="Host multi-crew game"
                number={2}
                onClick={props.hostMultiCrewServer}
            />

            <MenuItem
                text="Join multi-crew game"
                number={3}
                onClick={props.joinMultiCrewServer}
            />

            <MenuItem
                text="Card compendium"
                number={4}
                onClick={props.showCardCompendium}
            />

            <MenuItem
                text="Quit"
                number={5}
                emphasis="danger"
                onClick={props.quit}
                confirmPrompt="Are you sure you want to quit?"
            />
        </Menu>
    );
};
