import { useDraggable } from '@dnd-kit/core';
import { CardParameters } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { resolveParameters } from 'common-data/features/cards/utils/resolveParameters';
import { CardDisplay } from 'common-ui/features/cards/components/CardDisplay';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { classNames } from 'common-ui/utils/classNames';
import { FC, useState } from 'react';
import { useActiveCard, useDragDisplayMode, useIsOverValidTarget } from './DragCardProvider';
import styles from './DraggableCard.module.css';

type Props = {
    className?: string;
    id: number;
    elementId?: string;
    type: CardType;
    power: number;
    index: number;
    targetType?: CardTargetType;
    slotted?: boolean;
    modifiers?: CardParameters;
};

export const DraggableCard: FC<Props> = (props) => {
    const activeCard = useActiveCard();
    const isOverValidTarget = useIsOverValidTarget();

    const definition = getCardDefinition(props.type);
    const resolvedCost = resolveParameters(definition.parameters, props.modifiers).get('cost') ?? definition.cost;

    const targetType = props.targetType ?? definition.targetType;

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: props.elementId ?? props.id.toString(),
        data: { id: props.id, targetType, cardType: props.type },
    });

    const dragDisplayMode = useDragDisplayMode();
    const isBeingDragged = activeCard?.id === props.id && activeCard.cardType === props.type;
    const canDrop = isBeingDragged && isOverValidTarget;
    const followCursor = isBeingDragged && dragDisplayMode === 'card';

    const [isFocused, setIsFocused] = useState(false);

    return (
        <div
            ref={setNodeRef}
            className={classNames(
                styles.card,
                isBeingDragged ? styles.dragging : null,
                followCursor ? styles.followCursor : null,
                styles[`card--${targetType}`],
                canDrop ? styles.canDrop : null,
                props.className
            )}
            style={{
                // @ts-expect-error CSS custom property
                '--index': props.index,
                ...(followCursor && transform ? {
                    transform: `translate(${transform.x}px, ${transform.y}px)`,
                    transition: 'none',
                } : {}),
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...listeners}
            {...attributes}
        >
            <CardDisplay {...definition} slotted={props.slotted} sufficientPower={props.power >= resolvedCost} modifiers={props.modifiers} showTraits={isFocused && !isBeingDragged} />
        </div>
    );
};
