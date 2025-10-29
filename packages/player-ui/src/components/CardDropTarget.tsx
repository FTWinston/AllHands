import { useDroppable } from '@dnd-kit/core';
import { CardTargetType } from 'common-types';
import { classNames } from 'common-ui/classNames';
import { ElementType, FC, PropsWithChildren } from 'react';
import styles from './CardDropTarget.module.css';
import { useActiveCard } from './DragCardProvider';

type Props = PropsWithChildren<{
    id: string;
    className?: string;
    targetType: CardTargetType;
    render?: ElementType;
}>;

export const CardDropTarget: FC<Props> = (props) => {
    const activeCard = useActiveCard();

    const matchesActiveCardTargetType = activeCard && (!props.targetType || props.targetType === activeCard.targetType);

    const { setNodeRef, isOver } = useDroppable({
        id: props.id,
        data: {
            targetType: props.targetType,
        },
    });

    const willDropHere = isOver && matchesActiveCardTargetType;
    const couldDropHere = !isOver && matchesActiveCardTargetType;

    const Element = props.render ?? 'div';

    return (
        <Element
            ref={setNodeRef}
            className={classNames(
                styles.dropTarget,
                props.targetType === 'no-target' ? styles.noSpecificTarget : null,
                willDropHere ? styles.dropping : null,
                couldDropHere ? styles.couldDrop : null,
                props.className)}
        >
            {props.children}
        </Element>
    );
};
