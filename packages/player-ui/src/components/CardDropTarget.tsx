import { useDroppable } from '@dnd-kit/core';
import { CardTargetType } from 'common-types';
import { classNames } from 'common-ui/utils/classNames';
import { CSSProperties, ElementType, FC, PropsWithChildren } from 'react';
import styles from './CardDropTarget.module.css';
import { useActiveCard } from './DragCardProvider';

type Props = PropsWithChildren<{
    id: string;
    className?: string;
    targetType: CardTargetType;
    acceptAnyCardType?: boolean;
    render?: ElementType;
    disabled?: boolean;
    style?: CSSProperties;
}>;

export const CardDropTarget: FC<Props> = (props) => {
    const activeCard = useActiveCard();

    const matchesActiveCardTargetType = props.disabled !== true && activeCard && (props.acceptAnyCardType || props.targetType === activeCard.targetType);

    const { setNodeRef, isOver } = useDroppable({
        id: props.disabled ? '' : props.id,
        disabled: !matchesActiveCardTargetType,
        data: {
            acceptAnyCardType: props.acceptAnyCardType,
            targetType: props.targetType,
        },
    });

    const willDropHere = isOver && matchesActiveCardTargetType;
    const couldDropHere = !isOver && matchesActiveCardTargetType;

    const Element = props.render ?? 'div';

    const className = classNames(
        styles.dropTarget,
        props.targetType === 'no-target' ? styles.noSpecificTarget : null,
        willDropHere ? styles.dropping : null,
        couldDropHere ? styles.couldDrop : null,
        props.className);

    return (
        <Element
            ref={props.disabled ? undefined : setNodeRef}
            key={props.disabled ? 1 : 0}
            className={className}
            style={props.style}
        >
            {props.children}
        </Element>
    );
};
