import { ServerAddress } from 'common-data/types/ServerAddress';
import { FC, useState } from 'react';
import { InGameMenu } from './components/InGameMenu';
import { JoinMenu } from './components/JoinMenu';
import { MainMenu } from './components/MainMenu';

type Props = {
    isConnectedToGame: boolean;
    hostSingleCrewServer: () => void;
    hostMultiCrewServer: () => void;
    joinServer: (address: ServerAddress) => void;
    resumeGame: () => void;
    disconnect: () => void;
    quit: () => void;
};

export const MenuSelector: FC<Props> = (props) => {
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
