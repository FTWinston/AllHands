import { Snapshot } from '@colyseus/react';
import { EnemyTargetedCardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ScannedScienceInfo } from 'common-data/features/space/types/GameObjectInfo';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { resolveParameter } from 'common-ui/types/resolveParameters';
import { default as PowerIcon } from 'src/features/header/assets/power.svg?react';
import { ScanBase } from './ScanBase';
import { ScanCardSlot } from './ScanCardSlot';
import styles from './ScanScienceSystem.module.css';
import { ScanSection } from './ScanSection';

type Props = Snapshot<ScannedScienceInfo> & {
    name: string;
    vulnerability: EnemyTargetedCardType | null;
    onClose: () => void;
};

export const ScanScienceSystem = (props: Props) => {
    const { deflectorCard } = props;

    const deflectorCost = deflectorCard
        ? resolveParameter('cost', getCardDefinition(deflectorCard.type).parameters, deflectorCard.modifiers)
        : 0;

    return (
        <ScanBase
            system="science"
            power={props.power}
            vulnerability={props.vulnerability}
            targetName={props.name}
            targetId={props.targetId}
            onClose={props.onClose}
        >
            <ScanSection label="Sensors">
                {props.scanSystem
                    ? (
                        <span>
                            Scanning your
                            {' '}
                            <span className={styles.systemName}>{props.scanSystem}</span>
                        </span>
                    )
                    : <span className={styles.notScanning}>Not scanning your ship</span>}
            </ScanSection>

            <ScanCardSlot
                label="Deflector"
                card={deflectorCard}
                emptyText="No deflector"
                end={(
                    <span className={styles.cost} title="Power cost">
                        <PowerIcon className={styles.costIcon} aria-hidden={true} />
                        {deflectorCost}
                    </span>
                )}
            />
        </ScanBase>
    );
};
