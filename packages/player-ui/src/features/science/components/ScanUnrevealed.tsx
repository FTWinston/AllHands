import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { ScanBase } from './ScanBase';
import styles from './ScanUnrevealed.module.css';

type Props = {
    targetId: string;
    system?: ShipSystem;
    systemIndex: number;
};

export const ScanUnrevealed = (props: Props) => {
    const id = props.system
        ? `target/${props.targetId}/${props.system}`
        : `target/${props.targetId}/unknown/${props.systemIndex}`;

    return (
        <ScanBase expanded={false} id={id}>
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
