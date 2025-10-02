import { Screen } from 'common-ui/Screen';

import { FC } from 'react';
import { Menu } from './Menu';
import { MenuItem } from './MenuItem';

type Props = {
    resumeGame: () => void;
    disconnect: () => void;
};

export const InGameMenu: FC<Props> = (props) => {
    return (
        <Screen padded>
            <Menu title="Make It So">
                <MenuItem
                    text="Resume game"
                    onClick={props.resumeGame}
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
