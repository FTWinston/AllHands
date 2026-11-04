import { FC } from 'react';
import { CardsIcon, HostIcon, JoinIcon, PlayIcon, PowerIcon } from 'src/icons';
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
                icon={<PlayIcon />}
                emphasis="primary"
                onClick={props.hostSingleCrewServer}
            />

            <MenuItem
                text="Host multi-crew game"
                icon={<HostIcon />}
                onClick={props.hostMultiCrewServer}
            />

            <MenuItem
                text="Join multi-crew game"
                icon={<JoinIcon />}
                onClick={props.joinMultiCrewServer}
            />

            <MenuItem
                text="Card compendium"
                icon={<CardsIcon />}
                onClick={props.showCardCompendium}
            />

            <MenuItem
                text="Quit"
                icon={<PowerIcon />}
                emphasis="danger"
                onClick={props.quit}
                confirmPrompt="Are you sure you want to quit?"
            />
        </Menu>
    );
};
