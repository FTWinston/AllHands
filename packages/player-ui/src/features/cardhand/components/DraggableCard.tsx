import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CardTargetType, CardType } from 'common-types';
import { CardDisplay } from 'common-ui/features/cards/components/CardDisplay';
import { getCardDefinition } from 'common-ui/features/cards/utils/getCardDefinition';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import { useActiveCard, useIsOverValidTarget } from './DragCardProvider';
import styles from './DraggableCard.module.css';

type Props = {
    className?: string;
    id: number;
    type: CardType;
    index: number;
    targetType?: CardTargetType;
    slotted?: boolean;
};

export const DraggableCard: FC<Props> = (props) => {
    const activeCard = useActiveCard();
    const isOverValidTarget = useIsOverValidTarget();

    const definition = getCardDefinition(props.type);

    const targetType = props.targetType ?? definition.targetType;

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: props.id,
        data: { id: props.id, targetType },
    });

    const isBeingDragged = activeCard?.id === props.id;
    const canDrop = isBeingDragged && isOverValidTarget;

    return (
        <div
            ref={setNodeRef}
            className={classNames(
                styles.card,
                isBeingDragged ? styles.dragging : null,
                styles[`card--${targetType}`],
                canDrop ? styles.canDrop : null,
                props.className
            )}
            style={{
                // @ts-expect-error CSS custom property
                '--index': props.index,
                'transform': CSS.Translate.toString(transform),
            }}
            {...listeners}
            {...attributes}
        >
            <CardDisplay {...definition} slotted={props.slotted} />
        </div>
    );
};
