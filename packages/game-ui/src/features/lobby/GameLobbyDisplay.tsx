import { soloCrewIdentifier, type ServerAddress } from 'common-types';
import { Button } from 'common-ui/components/Button';
import { EngineeringIcon, HelmIcon, SensorsIcon, TacticalIcon } from 'common-ui/icons/crew';
import { Screen } from 'common-ui/components/Screen';
import { FC } from 'react';
import QRCode from 'react-qr-code';

import styles from './GameLobbyDisplay.module.css';
import { LobbyRole } from './LobbyRole';

export type SystemState = 'unoccupied' | 'occupied' | 'ready';

export type Props = {
    serverAddress: ServerAddress;
    crewId: string;
    allowMultipleCrews: boolean;
    disconnect: () => void;
    helmState: SystemState;
    tacticalState: SystemState;
    sensorsState: SystemState;
    engineerState: SystemState;
    numUnassigned: number;
    isFull: boolean;
};

export const GameLobbyDisplay: FC<Props> = (props) => {
    const { serverAddress, crewId, allowMultipleCrews, helmState, tacticalState, sensorsState, engineerState, numUnassigned } = props;

    let serverUrl = `http://${serverAddress.ip}:${serverAddress.port}/`;
    if (crewId !== soloCrewIdentifier) {
        serverUrl += `?crew=${crewId}`;
    }

    return (
        <Screen padded>
            <h1 className={styles.title}>Crew setup</h1>
            <div className={styles.sections}>
                <div className={styles.section}>
                    <h2 className={styles.sectionHeading}>Scan to connect</h2>
                    <p>
                        To join
                        {' '}
                        {allowMultipleCrews ? 'this crew' : 'the game'}
                        , use your phone camera to scan the QR code below,
                        or go to
                        {' '}
                        <strong className={styles.url}>{serverUrl}</strong>
                        {' '}
                        in your mobile browser.
                    </p>
                    <div className={styles.qrCodeContainer}>
                        <QRCode
                            className={styles.qrCode}
                            value={serverUrl}
                            size={256}
                            bgColor="var(--grey-mid)"
                        />
                        {props.isFull && <div className={styles.fullSize}>🚫</div>}
                    </div>
                </div>
                <div className={styles.section}>
                    <h2 className={styles.sectionHeading}>Crew roles</h2>
                    <p>
                        This crew has 4 different roles. Each crew member must select one.
                    </p>
                    <ul className={styles.roleList}>
                        <LobbyRole
                            name="Helm"
                            icon={<HelmIcon />}
                            state={helmState}
                        />
                        <LobbyRole
                            name="Tactical"
                            icon={<TacticalIcon />}
                            state={tacticalState}
                        />
                        <LobbyRole
                            name="Sensors"
                            icon={<SensorsIcon />}
                            state={sensorsState}
                        />
                        <LobbyRole
                            name="Engineer"
                            icon={<EngineeringIcon />}
                            state={engineerState}
                        />
                    </ul>
                    {numUnassigned > 0 && (
                        <p>
                            There
                            {' '}
                            {numUnassigned === 1 ? 'is' : 'are'}
                            {' '}
                            also
                            {' '}
                            <span className={styles.numUnassigned}>
                                {numUnassigned}
                                {' '}
                                unassigned
                            </span>
                            {' '}
                            crew member
                            {numUnassigned === 1 ? '' : 's'}
                            .
                        </p>
                    )}
                </div>
            </div>
            <div className={styles.footer}>
                <Button
                    onClick={props.disconnect}
                >
                    Disconnect
                </Button>
            </div>
        </Screen>
    );
};
