import { CrewRole, ownEngineerClientRole, ownHelmClientRole, ownScienceClientRole, ownTacticalClientRole } from 'common-data/features/ships/types/CrewRole';
import { soloCrewIdentifier } from 'common-data/utils/constants';
import { Screen } from 'common-ui/components/Screen';
import { ToggleButton } from 'common-ui/components/ToggleButton';
import { HelmIcon, TacticalIcon, ScienceIcon, EngineeringIcon } from 'common-ui/icons/crew';

import { FC } from 'react';
import styles from './GameLobbyDisplay.module.css';
import { LobbyRole } from './LobbyRole';

export type Props = {
    crewId: string;
    role: CrewRole | null;
    ready: boolean;
    helmOccupied: boolean;
    tacticalOccupied: boolean;
    scienceOccupied: boolean;
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
        scienceOccupied,
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
                        selected={role === ownHelmClientRole}
                        onSelectionChange={(selected) => {
                            onRoleChange(selected ? ownHelmClientRole : '');
                        }}
                    />
                </li>
                <li className={styles.roleItem}>
                    <LobbyRole
                        name="Tactical"
                        icon={<TacticalIcon />}
                        occupied={tacticalOccupied}
                        selected={role === ownTacticalClientRole}
                        onSelectionChange={(selected) => {
                            onRoleChange(selected ? ownTacticalClientRole : '');
                        }}
                    />
                </li>
                <li className={styles.roleItem}>
                    <LobbyRole
                        name="Science"
                        icon={<ScienceIcon />}
                        occupied={scienceOccupied}
                        selected={role === ownScienceClientRole}
                        onSelectionChange={(selected) => {
                            onRoleChange(selected ? ownScienceClientRole : '');
                        }}
                    />
                </li>
                <li className={styles.roleItem}>
                    <LobbyRole
                        name="Engineer"
                        icon={<EngineeringIcon />}
                        occupied={engineerOccupied}
                        selected={role === ownEngineerClientRole}
                        onSelectionChange={(selected) => {
                            onRoleChange(selected ? ownEngineerClientRole : '');
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
