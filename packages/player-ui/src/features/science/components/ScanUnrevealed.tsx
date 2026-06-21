import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { ScanBase } from './ScanBase';
import styles from './ScanUnrevealed.module.css';

type Props = {
    system?: ShipSystem;
};

export const ScanUnrevealed = (props: Props) => {
    return (
        <ScanBase expanded={false}>
            {props.system ? (
                <div className={styles.systemName}>
                    {props.system}
                </div>
            )
                : (
                    <div className={styles.unknownSystem}>
                        ?
                    </div>
                )}
        </ScanBase>
    );
};
