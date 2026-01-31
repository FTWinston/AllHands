import { useDroppable } from '@dnd-kit/core';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { classNames } from 'common-ui/utils/classNames';
import { ComponentPropsWithoutRef, ElementType, PropsWithChildren } from 'react';
import styles from './CardDropTarget.module.css';
import { useActiveCard } from './DragCardProvider';

type Props<C extends ElementType = 'div'> = PropsWithChildren<{
    id: string;
    className?: string;
    targetType: CardTargetType;
    acceptAnyCardType?: boolean;
    render?: C;
    disabled?: boolean;
    droppingClassName?: string;
    couldDropClassName?: string;
}> & ComponentPropsWithoutRef<C>;

export function CardDropTarget<C extends ElementType = 'div'>(props: Props<C>) {
    const activeCard = useActiveCard();

    const { id, className, targetType, acceptAnyCardType, render, disabled, children, couldDropClassName, droppingClassName, ...otherProps } = props;

    const matchesActiveCardTargetType = disabled !== true && activeCard && (acceptAnyCardType || targetType === activeCard.targetType);

    const { setNodeRef, isOver } = useDroppable({
        id: disabled ? '' : id,
        disabled: !matchesActiveCardTargetType,
        data: {
            acceptAnyCardType: acceptAnyCardType,
            targetType: targetType,
        },
    });

    const willDropHere = isOver && matchesActiveCardTargetType;
    const couldDropHere = !isOver && matchesActiveCardTargetType;

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
