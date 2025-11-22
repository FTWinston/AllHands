import { CrewRole, engineerClientRole, helmClientRole, sensorClientRole, soloCrewIdentifier, tacticalClientRole } from 'common-types';
import { HelmIcon, TacticalIcon, SensorsIcon, EngineeringIcon } from 'common-ui/icons/crew';
import { Screen } from 'common-ui/components/Screen';
import { ToggleButton } from 'common-ui/components/ToggleButton';

import { FC } from 'react';
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

export const GameLobbyDisplay: FC<Props> = (props) => {
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
        <Screen padded>
            <h1>Choose your role</h1>
            {crewId !== soloCrewIdentifier && (
                <p>
                    You are a member of crew
                    {crewId}
                    .
                </p>
            )}
            <ul className={styles.roleList}>
                <li className={styles.roleItem}>
                    <LobbyRole
                        name="Helm"
                        icon={<HelmIcon />}
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
                        icon={<TacticalIcon />}
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
                        icon={<SensorsIcon />}
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
                        icon={<EngineeringIcon />}
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
                    pressed={role !== null && ready}
                    disabled={role === null}
                    onPressedChanged={onReadyChange}
                    className={styles.readyToggle}
                >
                    {role !== null && ready ? 'Ready' : 'Not Ready'}
                </ToggleButton>
            </div>
        </Screen>
    );
};
