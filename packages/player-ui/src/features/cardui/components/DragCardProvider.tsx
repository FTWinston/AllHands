import { DndContext, DragEndEvent, DragMoveEvent, DragOverEvent, DragStartEvent, useSensor, PointerSensor, useSensors, pointerWithin, CollisionDetection } from '@dnd-kit/core';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { createContext, useState, useContext, PropsWithChildren, useRef, useCallback } from 'react';
import { CardDropEffect, DroppedCardEffect } from './CardDropEffect';
import { DragArrow } from './DragArrow';

export type ActiveCardInfo = {
    id: number;
    targetType: CardTargetType;
    cardType: CardType;
    isAlternateDrag?: boolean;
};

type DragPosition = {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
};

export type DragDisplayMode = 'arrow' | 'card' | 'none';

function getDragDisplayMode(activeCard: ActiveCardInfo | null): DragDisplayMode {
    if (!activeCard) return 'none';
    if (activeCard.isAlternateDrag) return 'arrow';
    switch (activeCard.targetType) {
        case 'no-target':
        case 'choice':
            return 'card';
        case 'location':
            return 'none';
        default:
            return 'arrow';
    }
}

type DragContextValue = {
    activeCard: ActiveCardInfo | null;
    overTargetId: string | null;
    dragDisplayMode: DragDisplayMode;
};

export const ActiveCardContext = createContext<DragContextValue>({ activeCard: null, overTargetId: null, dragDisplayMode: 'none' });

export const useActiveCard = () => useContext(ActiveCardContext).activeCard;
export const useIsOverValidTarget = () => useContext(ActiveCardContext).overTargetId !== null;
export const useOverTargetId = () => useContext(ActiveCardContext).overTargetId;
export const useDragDisplayMode = () => useContext(ActiveCardContext).dragDisplayMode;

// Custom collision detection that respects overflow:hidden clipping on the immediate parent container.
// This prevents drop targets clipped by overflow:hidden (e.g. hex cells at the edge of the map)
// from being considered valid when the pointer is outside the clipping container.
const clippedPointerWithin: CollisionDetection = (args) => {
    const collisions = pointerWithin(args);
    const { pointerCoordinates, droppableContainers } = args;

    if (!pointerCoordinates) return collisions;

    return collisions.filter((collision) => {
        const container = droppableContainers.find(c => c.id === collision.id);
        const node = container?.node.current;
        if (!node) return true;

        // Check the nearest overflow:hidden ancestor only
        let parent = node.parentElement;
        while (parent) {
            const overflow = getComputedStyle(parent).overflow;
            if (overflow === 'hidden' || overflow === 'clip') {
                const parentRect = parent.getBoundingClientRect();
                return pointerCoordinates.x >= parentRect.left
                    && pointerCoordinates.x <= parentRect.right
                    && pointerCoordinates.y >= parentRect.top
                    && pointerCoordinates.y <= parentRect.bottom;
            }
            parent = parent.parentElement;
        }
        return true;
    });
};

const clearFocus = () => {
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
};

type Props = PropsWithChildren<{
    onCardDropped: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    onAlternateDrop?: (targetId: string) => void;
}>;

export const DragCardProvider = ({ children, onCardDropped, onAlternateDrop }: Props) => {
    const [activeCard, setActiveCard] = useState<ActiveCardInfo | null>(null);
    const [overTargetId, setOverTargetId] = useState<string | null>(null);
    const [isOverDisabledTarget, setIsOverDisabledTarget] = useState(false);
    const [overTargetCenter, setOverTargetCenter] = useState<{ x: number; y: number } | null>(null);
    const [dragPosition, setDragPosition] = useState<DragPosition | null>(null);
    const [droppedCardEffect, setDroppedCardEffect] = useState<DroppedCardEffect | null>(null);

    // Store the initial pointer position so we can compute current pointer = initialPointer + delta
    const initialPointerRef = useRef({ x: 0, y: 0 });

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current as ActiveCardInfo | undefined;
        if (data) {
            setActiveCard({
                id: data.id,
                targetType: data.targetType,
                cardType: data.cardType,
                isAlternateDrag: data.isAlternateDrag,
            });
        }

        const pointerEvent = event.activatorEvent as PointerEvent;
        initialPointerRef.current = { x: pointerEvent.clientX, y: pointerEvent.clientY };

        // Arrow starts from below the center of dragged element
        const rect = event.active.rect.current.initial;
        const startX = rect ? rect.left + rect.width / 2 : pointerEvent.clientX;
        const startY = rect ? rect.top + 2 * rect.height / 3 : pointerEvent.clientY;

        setDragPosition({
            startX,
            startY,
            currentX: pointerEvent.clientX,
            currentY: pointerEvent.clientY,
        });

        // Blur the currently focused element, because another card might be focused.
        clearFocus();
    };

    const handleDragMove = useCallback((event: DragMoveEvent) => {
        const currentX = initialPointerRef.current.x + event.delta.x;
        const currentY = initialPointerRef.current.y + event.delta.y;
        setDragPosition(prev => prev && ({
            ...prev,
            currentX,
            currentY,
        }));
    }, []);

    const handleDragOver = (event: DragOverEvent) => {
        // Check if we're over a valid (not disabled) drop target
        const isValid = !!event.over && !event.over.disabled;
        setOverTargetId(isValid ? String(event.over!.id) : null);
        setIsOverDisabledTarget(!!event.over && event.over.disabled);

        if (isValid && event.over?.rect) {
            const rect = event.over.rect;
            setOverTargetCenter({ x: rect.left + rect.width / 2, y: rect.top + 2 * rect.height / 3 });
        } else {
            setOverTargetCenter(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        if (event.over?.id && activeCard) {
            if (activeCard.isAlternateDrag) {
                onAlternateDrop?.(String(event.over.id));
            } else {
                // Recalculate allowed using the latest activeCard and drop target type.
                const cardId = activeCard.id;

                const dropData = event.over.data.current;
                if (dropData) {
                    const targetType = dropData.targetType;
                    const allowed = dropData.acceptAnyCardType || targetType === activeCard.targetType;

                    if (allowed) {
                        onCardDropped(cardId, activeCard.cardType, targetType, String(event.over.id));

                        if (activeCard && dragPosition && targetType !== 'weapon-slot') {
                            setDroppedCardEffect({
                                id: activeCard.id,
                                cardType: activeCard.cardType,
                                x: dragPosition.currentX,
                                y: dragPosition.currentY,
                            });
                        }
                    }
                }
            }
        }

        // Blur the currently focused element (which is the dragged element)
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        setOverTargetId(null);
        setIsOverDisabledTarget(false);
        setOverTargetCenter(null);
        setActiveCard(null);
        setDragPosition(null);
    };

    const handleDragCancel = () => {
        // Blur the currently focused element.
        clearFocus();

        setOverTargetId(null);
        setIsOverDisabledTarget(false);
        setOverTargetCenter(null);
        setActiveCard(null);
        setDragPosition(null);
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
            collisionDetection={clippedPointerWithin}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <ActiveCardContext.Provider value={{ activeCard, overTargetId, dragDisplayMode: getDragDisplayMode(activeCard) }}>
                {children}
                {activeCard && dragPosition && getDragDisplayMode(activeCard) === 'arrow' && (
                    <DragArrow
                        startX={dragPosition.startX}
                        startY={dragPosition.startY}
                        endX={overTargetCenter?.x ?? dragPosition.currentX}
                        endY={overTargetCenter?.y ?? dragPosition.currentY}
                        targetState={overTargetId ? (activeCard.isAlternateDrag ? 'alternate' : 'card') : isOverDisabledTarget ? 'invalid' : 'none'}
                    />
                )}
                {droppedCardEffect && (
                    <CardDropEffect
                        key={droppedCardEffect.id}
                        effect={droppedCardEffect}
                        onComplete={() => setDroppedCardEffect(null)}
                    />
                )}
            </ActiveCardContext.Provider>
        </DndContext>
    );
};
