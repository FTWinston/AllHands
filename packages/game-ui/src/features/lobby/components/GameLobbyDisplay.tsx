import { soloCrewIdentifier } from 'common-data/utils/constants';
import { Button } from 'common-ui/components/Button';
import { Screen } from 'common-ui/components/Screen';
import { FC } from 'react';
import QRCode from 'react-qr-code';
import { TopBar } from 'src/components/TopBar';
import { PowerIcon } from 'src/icons';
import styles from './GameLobbyDisplay.module.css';
import { LobbyRole } from './LobbyRole';
import type { ServerAddress } from 'common-data/types/ServerAddress';

export type SystemState = 'unoccupied' | 'occupied';

export type Props = {
    serverAddress: ServerAddress;
    crewId: string;
    allowMultipleCrews: boolean;
    disconnect: () => void;
    helmState: SystemState;
    tacticalState: SystemState;
    scienceState: SystemState;
    engineerState: SystemState;
    numUnassigned: number;
    isFull: boolean;
    /** Seconds until the game starts, once every role is claimed; 0 when not counting down. */
    startCountdown: number;
    /** The countdown has finished, and the lobby is fading out as the game starts. */
    launching?: boolean;
};

export const GameLobbyDisplay: FC<Props> = (props) => {
    const { serverAddress, crewId, allowMultipleCrews, helmState, tacticalState, scienceState, engineerState, numUnassigned, startCountdown, launching } = props;

    let serverUrl = `http://${serverAddress.ip}:${serverAddress.port}/`;
    if (crewId !== soloCrewIdentifier) {
        serverUrl += `?crew=${crewId}`;
    }

    const numCrewed = [helmState, tacticalState, scienceState, engineerState]
        .filter(state => state === 'occupied')
        .length;

    return (
        <Screen className={styles.screen}>
            <TopBar
                branded
                end={(
                    <Button
                        className={styles.disconnect}
                        onClick={props.disconnect}
                        palette="danger"
                        outlined
                        startIcon={<PowerIcon />}
                    >
                        Disconnect
                    </Button>
                )}
            >
                <h1 className={styles.title}>Crew assembly</h1>
                {allowMultipleCrews && (
                    <span className={styles.crewChip}>
                        Crew
                        {' '}
                        {crewId}
                    </span>
                )}
            </TopBar>

            <div className={styles.body}>
                <section className={styles.joinPanel} aria-label="How to join">
                    <p className={styles.label}>Scan to join</p>
                    <div className={styles.qrCodeContainer}>
                        <QRCode
                            className={styles.qrCode}
                            value={serverUrl}
                            size={256}
                            fgColor="var(--space)"
                            bgColor="transparent"
                        />
                        {props.isFull && (
                            <div className={styles.full}>
                                <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                                </svg>
                                Crew full
                            </div>
                        )}
                    </div>
                    <p className={styles.label}>Or open on your phone</p>
                    <p className={styles.url}>{serverUrl}</p>
                    <p className={styles.hint}>
                        Everyone joins
                        {' '}
                        {allowMultipleCrews ? 'this crew' : 'the game'}
                        {' '}
                        on their own phone, then claims one of the four stations.
                    </p>
                </section>

                <section className={styles.stations} aria-label="Stations">
                    <div className={styles.stationsHeader}>
                        <h2 className={styles.label}>Stations</h2>
                        <p className={styles.crewedCount}>
                            {numCrewed}
                            {' '}
                            of 4 crewed
                        </p>
                    </div>

                    <ul className={styles.roleList}>
                        <LobbyRole system="helm" state={helmState} />
                        <LobbyRole system="tactical" state={tacticalState} />
                        <LobbyRole system="science" state={scienceState} />
                        <LobbyRole system="engineer" state={engineerState} />
                    </ul>

                    {startCountdown > 0 || launching
                        ? (
                            <div className={styles.countdown} role="timer" aria-live="polite">
                                <span className={styles.countdownValue}>{startCountdown}</span>
                                <div className={styles.statusText}>
                                    <p className={styles.statusTitle}>
                                        {startCountdown > 0 ? `Launching in ${startCountdown}` : 'Launching'}
                                    </p>
                                    <p className={styles.statusDetail}>
                                        To hold the launch, any crew member can tap
                                        {' '}
                                        <strong>Change role</strong>
                                        .
                                    </p>
                                </div>
                            </div>
                        )
                        : (
                            <div className={styles.status} role="status">
                                <span className={styles.statusDot} aria-hidden="true" />
                                <div className={styles.statusText}>
                                    <p className={styles.statusTitle}>{getWaitingText(numCrewed, numUnassigned)}</p>
                                    <p className={styles.statusDetail}>The game launches as soon as every station is crewed.</p>
                                </div>
                            </div>
                        )}
                </section>
            </div>
        </Screen>
    );
};

function getWaitingText(numCrewed: number, numUnassigned: number) {
    if (numUnassigned > 0) {
        return `${numUnassigned} crew member${numUnassigned === 1 ? '' : 's'} still choosing a station`;
    }

    return numCrewed === 0
        ? 'Waiting for the crew to join'
        : 'Waiting for more crew to join';
}
