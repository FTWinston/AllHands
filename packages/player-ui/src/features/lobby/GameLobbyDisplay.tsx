import { CrewRole, engineerClientRole, helmClientRole, sensorClientRole, soloCrewIdentifier, tacticalClientRole } from 'common-types';
import { Screen } from 'common-ui/Screen';
import { ToggleButton } from 'common-ui/ToggleButton';

import styles from './GameLobbyDisplay.module.css';
import { LobbyRole } from './LobbyRole';

export type Props = {
    crewId: string;
    role: CrewRole | null;
    ready: boolean;
    helmOccupied: boolean;
    tacticalOccupied: boolean;
    sensorsOccupied: boolean;
    engineerOccupied: boolean;
    onRoleChange: (role: CrewRole | '') => void;
    onReadyChange: (ready: boolean) => void;
};

export const GameLobbyDisplay: React.FC<Props> = (props) => {
    const {
        crewId,
        role,
        ready,
        helmOccupied,
        tacticalOccupied,
        sensorsOccupied,
        engineerOccupied,
        onRoleChange,
        onReadyChange,
    } = props;

    return (
        <Screen>
            <h1>Choose your role</h1>
            {crewId !== soloCrewIdentifier && <p>You are a member of crew {crewId}.</p>}
            <ul className={styles.roleList}>
                <li className={styles.roleItem}>
                    <LobbyRole
                        name="Helm"
                        occupied={helmOccupied}
                        selected={role === helmClientRole}
                        onSelectionChange={(selected) => {
                            onRoleChange(selected ? helmClientRole : '');
                        }}
                    />
                </li>
                <li className={styles.roleItem}>
                    <LobbyRole
                        name="Tactical"
                        occupied={tacticalOccupied}
                        selected={role === tacticalClientRole}
                        onSelectionChange={(selected) => {
                            onRoleChange(selected ? tacticalClientRole : '');
                        }}
                    />
                </li>
                <li className={styles.roleItem}>
                    <LobbyRole
                        name="Sensors"
                        occupied={sensorsOccupied}
                        selected={role === sensorClientRole}
                        onSelectionChange={(selected) => {
                            onRoleChange(selected ? sensorClientRole : '');
                        }}
                    />
                </li>
                <li className={styles.roleItem}>
                    <LobbyRole
                        name="Engineer"
                        occupied={engineerOccupied}
                        selected={role === engineerClientRole}
                        onSelectionChange={(selected) => {
                            onRoleChange(selected ? engineerClientRole : '');
                        }}
                    />
                </li>
            </ul>
            <p>
                When you&apos;re happy with your role, indicate that you are ready.
                When every role is occupied and ready, the game will start.
            </p>

            <div className={styles.footer}>
                <ToggleButton
                    label={role !== null && ready ? 'Ready' : 'Not Ready'}
                    pressed={role !== null && ready}
                    disabled={role === null}
                    onPressedChanged={onReadyChange}
                    className={styles.readyToggle}
                />
            </div>
        </Screen>
    );
};
