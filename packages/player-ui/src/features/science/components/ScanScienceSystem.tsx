import { IArray, Snapshot } from '@colyseus/react';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { ScannedScienceInfo } from 'common-data/features/space/types/GameObjectInfo';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { Card } from 'common-ui/features/cards/components/Card';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { classNames } from 'common-ui/utils/classNames';
import React from 'react';
import { ScanBase } from './ScanBase';
import styles from './ScanScienceSystem.module.css';

type Props = Snapshot<ScannedScienceInfo>;

const DeflectorSlot = (props: Snapshot<ScannedScienceInfo>) => {
    if (props.deflectorCard) {
        const cardDef = getCardDefinition(props.deflectorCard.type);

        return (
            <InfoPopup
                className={styles.deflectorSlot}
                description={<Card {...props.deflectorCard} disabled={true} />}
            >
                <div className={styles.itemLabel}>Deflector</div>
                <div className={styles.cardName}>{cardDef.name}</div>
            </InfoPopup>
        );
    } else {
        return (
            <div className={classNames(styles.deflectorSlot, styles.emptySlot)}>
                <div className={styles.itemLabel}>Deflector</div>
                <div className={styles.cardName}>(No action)</div>
            </div>
        );
    }
};

const ScanTargetList = ({ scanSystems }: { scanSystems: IArray<ShipSystem> }) => {
    if (!scanSystems || scanSystems.length === 0) {
        return <div className={styles.notScanning}>(Not scanning your ship)</div>;
    }

    const nodes: React.ReactNode[] = [];
    scanSystems.forEach((system, i) => {
        if (i > 0) {
            nodes.push(i === scanSystems.length - 1 ? ' & ' : ', ');
        }
        nodes.push(<span key={i} className={styles.systemName}>{system}</span>);
    });

    return (
        <div className={classNames(styles.scanTargetList, styles[`scanTargetList_num${scanSystems.length}`])}>
            Scanning your
            {' '}
            {nodes}
            {scanSystems.length === 1 ? ' system' : ' systems'}
            .
        </div>
    );
};

export const ScanScienceSystem = (props: Props) => {
    return (
        <ScanBase className={styles.root} expanded>
            <div className={styles.scanTargets}>
                <div className={styles.itemLabel}>Sensors</div>
                <ScanTargetList scanSystems={props.scanSystems} />
            </div>
            <DeflectorSlot {...props} />
        </ScanBase>
    );
};
