import { Snapshot } from '@colyseus/react';
import { EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ScannedHelmInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ScanBase } from './ScanBase';
import { ScanCardSlot } from './ScanCardSlot';
import styles from './ScanHelmSystem.module.css';
import { ScanSection } from './ScanSection';

type Props = Snapshot<ScannedHelmInfo> & {
    name: string;
    vulnerability: EnemyTargetedCardType | null;
    onClose: () => void;
};

export const ScanHelmSystem = (props: Props) => {
    const evasionChancePercent = props.evasionChance;

    return (
        <ScanBase
            contentClassName={styles.root}
            system="helm"
            vulnerability={props.vulnerability}
            targetName={props.name}
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
