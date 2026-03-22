import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { useActiveCard } from 'src/features/cardui/components/DragCardProvider';
import { RepairIndicator } from './RepairIndicator';
import { System, SystemInfo } from './System';
import styles from './SystemList.module.css';

type Props = {
    systems: MinimalReadonlyArray<SystemInfo>;
    repairCapacity: number;
    maxRepairCapacity: number;
};

export const SystemList = (props: Props) => {
    const activeCard = useActiveCard();
    const isAlternateDrag = activeCard?.isAlternateDrag === true;

    return (
        <ul className={styles.list}>
            {props.systems.map(system => (
                <CardDropTarget
                    render="li"
                    className={styles.itemWrapper}
                    key={system.system}
                    targetType="system"
                    id={system.system}
                >
                    <System {...system} />
                </CardDropTarget>
            ))}

            <CardDropTarget
                render="li"
                className={styles.repairWrapper}
                targetType="system"
                id="repair"
                disabled={isAlternateDrag}
            >
                <RepairIndicator value={props.repairCapacity} max={props.maxRepairCapacity} />
            </CardDropTarget>
        </ul>
    );
};
