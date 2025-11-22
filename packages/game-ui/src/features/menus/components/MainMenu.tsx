import { Screen } from 'common-ui/components/Screen';

import { FC } from 'react';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';

type Props = {
    hostSingleCrewServer: () => void;
    hostMultiCrewServer: () => void;
    joinMultiCrewServer: () => void;
    quit: () => void;
};

export const MainMenu: FC<Props> = (props) => {
    return (
        <Screen padded>
            <Menu title="Make It So">
                <MenuItem
                    text="Start single-crew game"
                    onClick={props.hostSingleCrewServer}
                />

                <MenuItem
                    text="Host multi-crew game"
                    onClick={props.hostMultiCrewServer}
                />

                <MenuItem
                    text="Join multi-crew game"
                    onClick={props.joinMultiCrewServer}
                />

                <MenuItem
                    text="Quit"
                    onClick={props.quit}
                    confirmPrompt="Are you sure you want to quit?"
                />
            </Menu>
        </Screen>
    );
};
