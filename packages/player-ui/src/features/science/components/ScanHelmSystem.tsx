import { Snapshot } from '@colyseus/react';
import { ScannedHelmInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ScanBase } from './ScanBase';
import { ScanCardSlot } from './ScanCardSlot';
import styles from './ScanHelmSystem.module.css';
import { ScanSection } from './ScanSection';

type Props = Snapshot<ScannedHelmInfo> & {
    onClose: () => void;
};

export const ScanHelmSystem = (props: Props) => {
    const evasionChancePercent = props.evasionChance;

    return (
        <ScanBase
            contentClassName={styles.root}
            system="helm"
            targetId={props.targetId}
            onClose={props.onClose}
        >
            <ScanCardSlot
                label="Maneuver"
                card={props.activeManeuver}
                emptyText="(No maneuver)"
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
