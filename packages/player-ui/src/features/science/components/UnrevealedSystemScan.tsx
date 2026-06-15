import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { SystemScanBase } from './SystemScanBase';
import styles from './UnrevealedSystemScan.module.css';

type Props = {
    system?: ShipSystem;
};

export const UnrevealedSystemScan = (props: Props) => {
    const content = props.system ? (
        <div className={styles.knownSystem}>
            {props.system}
        </div>
    ) : (
        <div className={styles.unknownSystem}>
            ?
        </div>
    );

    return (
        <SystemScanBase className={styles.root}>
            {content}
        </SystemScanBase>
    );
};
