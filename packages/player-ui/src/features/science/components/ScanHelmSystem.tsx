import { Snapshot } from '@colyseus/react';
import { ScannedHelmInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ScanBase } from './ScanBase';
import { ScanCardSlot } from './ScanCardSlot';
import styles from './ScanHelmSystem.module.css';
import { ScanSection } from './ScanSection';

type Props = Snapshot<ScannedHelmInfo>;

export const ScanHelmSystem = (props: Props) => {
    const evasionChancePercent = 0;

    return (
        <ScanBase className={styles.root} expanded>
            <ScanCardSlot
                label="Maneuver"
                card={props.activeManeuver}
                emptyText="(No maneuver)"
                emptyTextClassName={styles.emptyManeuverName}
            />

            <ScanSection label="Evasion">
                <div className={styles.evasionValue}>
                    {evasionChancePercent}
                    %
                </div>
            </ScanSection>
        </ScanBase>
    );
};
