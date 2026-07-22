import { IArray, Snapshot } from '@colyseus/react';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { ScannedScienceInfo } from 'common-data/features/space/types/GameObjectInfo';
import { classNames } from 'common-ui/utils/classNames';
import React from 'react';
import { ScanBase } from './ScanBase';
import { ScanCardSlot } from './ScanCardSlot';
import styles from './ScanScienceSystem.module.css';
import { ScanSection } from './ScanSection';

type Props = Snapshot<ScannedScienceInfo>;

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
    const id = `target/${props.targetId}/science`;

    return (
        <ScanBase className={styles.root} expanded id={id}>
            <ScanSection label="Sensors">
                <ScanTargetList scanSystems={props.scanSystems} />
            </ScanSection>
            <ScanCardSlot
                label="Deflector"
                card={props.deflectorCard}
                emptyText="(No action)"
            />
        </ScanBase>
    );
};
