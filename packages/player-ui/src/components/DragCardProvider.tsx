import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, PointerSensor, useSensors, Modifier, defaultDropAnimation } from '@dnd-kit/core';
import { CardTargetType } from 'common-types';
import { Card, CardProps } from 'common-ui/Card';
import { createContext, useState, ReactNode, useContext } from 'react';
import styles from './DragCardProvider.module.css';

export type ActiveCardInfo = {
    id: number;
    targetType: CardTargetType;
};

export const ActiveCardContext = createContext<ActiveCardInfo | null>(null);

export const useActiveCard = () => useContext(ActiveCardContext);

const snapTopCenterToCursor: Modifier = ({ transform, draggingNodeRect, activatorEvent }) => {
    if (draggingNodeRect && activatorEvent) {
        // Get the pointer position relative to the dragging node
        const activatorCoordinates = {
            x: (activatorEvent as PointerEvent).clientX,
            y: (activatorEvent as PointerEvent).clientY,
        };

        return {
            ...transform,
            x: transform.x + (activatorCoordinates.x - draggingNodeRect.left - draggingNodeRect.width / 2),
            y: transform.y + (activatorCoordinates.y - draggingNodeRect.top),
        };
    }
    return transform;
};

type Props = {
    children: ReactNode;
    onCardDropped?: (cardId: number, targetId: string | null) => void;
};

export const DragCardProvider = ({ children, onCardDropped }: Props) => {
    const [activeCard, setActiveCard] = useState<CardProps | null>(null);
    const [wasDropped, setWasDropped] = useState(false);

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current as CardProps | undefined;
        if (data) {
            setActiveCard(data);
            setWasDropped(false);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const cardId = event.active.id;
        const targetId = event.over?.id;

        if (targetId !== undefined && onCardDropped && typeof cardId === 'number') {
            onCardDropped(cardId, targetId ? String(targetId) : null);
            setWasDropped(true);
        }

        setActiveCard(null);
    };

    const handleDragCancel = () => {
        setActiveCard(null);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 100,
            },
        })
    );

    const dropAnimation = wasDropped ? null : defaultDropAnimation;

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            modifiers={[snapTopCenterToCursor]}
        >
            <ActiveCardContext.Provider value={activeCard}>
                {children}
            </ActiveCardContext.Provider>
            <DragOverlay dropAnimation={dropAnimation}>
                {activeCard && (<Card {...activeCard} className={styles.dragging} />)}
            </DragOverlay>
        </DndContext>
    );
};
