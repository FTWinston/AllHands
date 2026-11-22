import { useDraggable } from '@dnd-kit/core';
import { classNames } from 'common-ui/utils/classNames';
import { default as RepairIcon } from '../assets/repair.svg?react';
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
            {/* The same icon as beside each system's damage that can be repaired, so it's clear they go together. */}
            <RepairIcon className={styles.icon} aria-hidden="true" />
            <span className={styles.label}>
                Repair capacity:
                {' '}
                {props.value}
                {' / '}
                {props.max}
            </span>
        </div>
    );
};
