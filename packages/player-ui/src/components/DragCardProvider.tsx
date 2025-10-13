import { DndContext, DragEndEvent, DragStartEvent, useSensor, PointerSensor, useSensors, Modifier } from '@dnd-kit/core';
import { CardTargetType } from 'common-types';
import { CardProps } from 'common-ui/Card';
import { createContext, useState, ReactNode, useContext } from 'react';

export type ActiveCardInfo = {
    id: number;
    targetType: CardTargetType;
    index: number;
    numCards: number;
    cardProps: CardProps;
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
    const [activeCard, setActiveCard] = useState<ActiveCardInfo | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current as (CardProps & { index: number; numCards: number }) | undefined;
        if (data) {
            setActiveCard({
                id: data.id,
                targetType: data.targetType,
                index: data.index,
                numCards: data.numCards,
                cardProps: data,
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const cardId = event.active.id;
        const targetId = event.over?.id;

        if (targetId !== undefined && onCardDropped && typeof cardId === 'number') {
            onCardDropped(cardId, targetId ? String(targetId) : null);
        }

        // Blur the currently focused element (which is the dragged element)
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        setActiveCard(null);
    };

    const handleDragCancel = () => {
        // Blur the currently focused element
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        setActiveCard(null);
    };

    // You must move the touch 100 pixels to start a drag, so you can see focused cards nicely.
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 100,
            },
        })
    );

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
        </DndContext>
    );
};
