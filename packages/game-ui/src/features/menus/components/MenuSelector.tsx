import { ServerAddress } from 'common-types';
import { useState } from 'react';

import { InGameMenu } from './InGameMenu';
import { JoinMenu } from './JoinMenu';
import { MainMenu } from './MainMenu';

type Props = {
    isConnectedToGame: boolean;
    hostSingleCrewServer: () => void;
    hostMultiCrewServer: () => void;
    joinServer: (address: ServerAddress) => void;
    resumeGame: () => void;
    disconnect: () => void;
    quit: () => void;
};

export const MenuSelector: React.FC<Props> = (props) => {
    const [joining, setJoining] = useState(false);

    if (props.isConnectedToGame) {
        return (
            <InGameMenu
                resumeGame={props.resumeGame}
                disconnect={props.disconnect}
            />
        );
    }

    if (joining) {
        return (
            <JoinMenu
                joinServer={props.joinServer}
                back={() => setJoining(false)}
            />
        );
    }

    return (
        <MainMenu
            hostSingleCrewServer={props.hostSingleCrewServer}
            hostMultiCrewServer={props.hostMultiCrewServer}
            joinMultiCrewServer={() => setJoining(true)}
            quit={props.quit}
        />
    );
};
