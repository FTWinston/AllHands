import { useDroppable } from '@dnd-kit/core';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { classNames } from 'common-ui/utils/classNames';
import { ComponentPropsWithRef, ElementType, PropsWithChildren, RefObject, useCallback } from 'react';
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
}> & ComponentPropsWithRef<C>;

export function CardDropTarget<C extends ElementType = 'div'>(props: Props<C>) {
    const activeCard = useActiveCard();

    const { id, className, targetType, acceptAnyCardType, canAcceptCard, render, disabled, children, couldDropClassName, droppingClassName, ref, ...otherProps } = props;

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

    const mergedRef = useCallback((node: Element | null) => {
        setNodeRef(node as HTMLElement | null);
        if (typeof ref === 'function') {
            ref(node as never);
        } else if (ref != null) {
            (ref as RefObject<Element | null>).current = node;
        }
    }, [setNodeRef, ref]);

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
            ref={disabled ? undefined : mergedRef}
            key={disabled ? 1 : 0}
            className={componentClasses}
            {...otherProps}
        >
            {children}
        </Component>
    );
};
