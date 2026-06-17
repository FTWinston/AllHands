import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { ScanBase } from './ScanBase';
import styles from './ScanUnrevealed.module.css';

type Props = {
    system?: ShipSystem;
};

export const ScanUnrevealed = (props: Props) => {
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
        <ScanBase className={styles.root}>
            {content}
        </ScanBase>
    );
};
