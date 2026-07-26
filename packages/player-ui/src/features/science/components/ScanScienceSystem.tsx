import { Snapshot } from '@colyseus/react';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { ScannedScienceInfo } from 'common-data/features/space/types/GameObjectInfo';
import { RestrictedHeightText } from 'common-ui/components/RestrictedHeightText';
import { ScanBase } from './ScanBase';
import { ScanCardSlot } from './ScanCardSlot';
import styles from './ScanScienceSystem.module.css';
import { ScanSection } from './ScanSection';

type Props = Snapshot<ScannedScienceInfo> & {
    name: string;
    onClose: () => void;
};

const ScanTargetList = ({ scanSystem }: { scanSystem: ShipSystem | null }) => {
    if (!scanSystem) {
        return <div className={styles.notScanning}>(Not scanning your&nbsp;ship)</div>;
    }

    return (
        <RestrictedHeightText className={styles.scanTargetList}>
            Scanning your
            {' '}
            <span className={styles.systemName}>{scanSystem}</span>
            {' '}
            system.
        </RestrictedHeightText>
    );
};

export const ScanScienceSystem = (props: Props) => {
    return (
        <ScanBase
            contentClassName={styles.root}
            system="science"
            targetName={props.name}
            targetId={props.targetId}
            onClose={props.onClose}
        >
            <ScanSection label="Sensors">
                <ScanTargetList scanSystem={props.scanSystem} />
            </ScanSection>
            <ScanCardSlot
                label="Deflector"
                card={props.deflectorCard}
                emptyText="(No action)"
            />
        </ScanBase>
    );
};
