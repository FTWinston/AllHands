import { useDroppable } from '@dnd-kit/core';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { classNames } from 'common-ui/utils/classNames';
import { ComponentPropsWithoutRef, ElementType, PropsWithChildren } from 'react';
import styles from './CardDropTarget.module.css';
import { ActiveCardInfo, useActiveCard } from './DragCardProvider';

type Props<C extends ElementType = 'div'> = PropsWithChildren<{
    id: string;
    className?: string;
    targetType: CardTargetType;
    acceptAnyCardType?: boolean;
    canAcceptCard?: (card: ActiveCardInfo) => boolean;
    render?: C;
    disabled?: boolean;
    droppingClassName?: string;
    couldDropClassName?: string;
}> & ComponentPropsWithoutRef<C>;

export function CardDropTarget<C extends ElementType = 'div'>(props: Props<C>) {
    const activeCard = useActiveCard();

    const { id, className, targetType, acceptAnyCardType, canAcceptCard, render, disabled, children, couldDropClassName, droppingClassName, ...otherProps } = props;

    const matchesActiveCard = disabled !== true && activeCard
        && (acceptAnyCardType || targetType === activeCard.targetType)
        && (canAcceptCard === undefined || canAcceptCard(activeCard));

    const { setNodeRef, isOver } = useDroppable({
        id: disabled ? '' : id,
        disabled: !matchesActiveCard,
        data: {
            acceptAnyCardType,
            targetType,
            canAcceptCard,
        },
    });

    const willDropHere = isOver && matchesActiveCard;
    const couldDropHere = !isOver && matchesActiveCard;

    const Component = render ?? 'div';

    const componentClasses = classNames(
        styles.dropTarget,
        targetType === 'no-target' || targetType === 'choice' ? styles.noSpecificTarget : null,
        willDropHere ? styles.dropping : null,
        willDropHere ? droppingClassName : null,
        couldDropHere ? styles.couldDrop : null,
        couldDropHere ? couldDropClassName : null,
        className);

    return (
        <Component
            ref={disabled ? undefined : setNodeRef}
            key={disabled ? 1 : 0}
            className={componentClasses}
            {...otherProps}
        >
            {children}
        </Component>
    );
};
