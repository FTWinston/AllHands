import { CardDropTarget } from 'src/features/cardui/components/CardDropTarget';
import { System, SystemInfo } from './System';
import styles from './SystemList.module.css';

type Props = {
    systems: SystemInfo[];
};

export const SystemList = (props: Props) => {
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
        </ul>
    );
};
