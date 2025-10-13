import { useDroppable } from '@dnd-kit/core';
import { classNames } from 'common-ui/classNames';
import { FC, PropsWithChildren } from 'react';
import styles from './CardDropTarget.module.css';
import { useActiveCard } from './DragCardProvider';

type Props = PropsWithChildren<{
    id: string;
    className?: string;
    targetType?: string;
}>;

export const CardDropTarget: FC<Props> = (props) => {
    const activeCard = useActiveCard();

    const matchesActiveCardTargetType = activeCard && (!props.targetType || props.targetType === activeCard.targetType);

    const { setNodeRef, isOver } = useDroppable({
        id: props.id,
        data: {
            targetType: props.targetType,
        },
        disabled: !matchesActiveCardTargetType,
    });

    const canDropHere = isOver && matchesActiveCardTargetType;
    const couldDropHere = !isOver && matchesActiveCardTargetType;

    return (
        <div
            ref={setNodeRef}
            className={classNames(canDropHere ? styles.dropping : null, couldDropHere ? styles.couldDrop : null, props.className)}
        >
            {props.children}
        </div>
    );
};
