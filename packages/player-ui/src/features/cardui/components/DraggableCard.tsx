import { useDraggable } from '@dnd-kit/core';
import { CardParametersBase } from 'common-data/features/cards/types/CardParameters';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardTrait } from 'common-data/features/cards/types/CardTrait';
import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CardDisplay } from 'common-ui/features/cards/components/CardDisplay';
import { UICardDefinition } from 'common-ui/features/cards/types/UICardDefinition';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { resolveParameter } from 'common-ui/types/resolveParameters';
import { classNames } from 'common-ui/utils/classNames';
import { FC, useState } from 'react';
import { useActiveCard, useDragDisplayMode, useIsOverValidTarget } from './DragCardProvider';
import styles from './DraggableCard.module.css';

type Props = {
    className?: string;
    id: number;
    elementId?: string;
    availablePower: number;
    index: number;
    targetType?: CardTargetType;
    slotted?: boolean;
    highlighted?: boolean;
    modifiers?: CardParametersBase;
    extraTraits?: Partial<Record<CardTrait, ExtraTraitType>>;
    type: CardType;
    /** For cards that are not card definitions, which have no definition to look up by `type`. These don't list their extra traits. */
    definition?: UICardDefinition;
};

export const DraggableCard: FC<Props> = (props) => {
    const activeCard = useActiveCard();
    const isOverValidTarget = useIsOverValidTarget();

    const definition = props.definition ?? getCardDefinition(props.type);
    const resolvedCost = resolveParameter('cost', definition.parameters, props.modifiers);

    const targetType = props.targetType ?? definition.targetType;

    const isDamaged = props.extraTraits?.['damaged'] !== undefined || props.extraTraits?.['critical'] !== undefined;
    const isUnplayable = props.extraTraits?.['unplayable'] !== undefined;
    const isPriority = definition.traits?.includes('priority') || props.extraTraits?.['priority'] !== undefined;

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: props.elementId ?? props.id.toString(),
        disabled: isUnplayable,
        data: { id: props.id, targetType, cardType: props.type, isDamaged, isPriority },
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
            <CardDisplay
                {...definition}
                slotted={props.slotted}
                disabled={isUnplayable}
                highlighted={props.highlighted}
                sufficientPower={props.slotted ? undefined : props.availablePower >= resolvedCost}
                modifiers={props.modifiers}
                extraTraits={props.extraTraits}
                listExtraTraits={props.definition === undefined}
                showTraitDescriptions={isFocused && !isBeingDragged}
            />
        </div>
    );
};
