import { useDraggable } from '@dnd-kit/core';
import { classNames } from 'common-ui/utils/classNames';
import styles from './RepairIndicator.module.css';

type Props = {
    value: number;
    max: number;
};

export const RepairIndicator = (props: Props) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: 'repair-energy',
        data: { targetType: 'system', isAlternateDrag: true },
        disabled: props.value <= 0,
    });

    const fillPercent = props.max > 0 ? Math.min(100, (props.value / props.max) * 100) : 0;

    return (
        <div
            ref={setNodeRef}
            className={classNames(
                styles.indicatorBar,
                isDragging ? styles.dragging : null,
                props.value > 0 ? styles.hasValue : null
            )}
            {...listeners}
            {...attributes}
        >
            <div className={styles.fill} style={{ height: `${fillPercent}%` }} />
            <span className={styles.label}>
                Repair capacity:
                {' '}
                {props.value}
            </span>
        </div>
    );
};
