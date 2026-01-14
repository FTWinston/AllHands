import { DndContext, DragEndEvent, DragStartEvent, useSensor, PointerSensor, useSensors, DragOverlay, Modifier } from '@dnd-kit/core';
import { ChoiceCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { createContext, useState, ReactNode, useContext } from 'react';
import { CardDropTarget } from './CardDropTarget';

export type ActiveCardInfo = {
    id: number;
    targetType: CardTargetType;
    cardType: CardType;
};

type DragContextValue = {
    activeCard: ActiveCardInfo | null;
    isOverValidTarget: boolean;
};

export const ActiveCardContext = createContext<DragContextValue>({ activeCard: null, isOverValidTarget: false });

export const useActiveCard = () => useContext(ActiveCardContext).activeCard;
export const useIsOverValidTarget = () => useContext(ActiveCardContext).isOverValidTarget;

const snapTopCenterToCursor: Modifier = ({ transform, draggingNodeRect, activatorEvent }) => {
    if (draggingNodeRect && activatorEvent) {
        // Get the pointer position relative to the dragging node
        const activatorCoordinates = {
            x: (activatorEvent as PointerEvent).clientX,
            y: (activatorEvent as PointerEvent).clientY,
        };

        // Note: this offset is different if you start the drag very rapidly,
        // compared to if you do it very slowly. Not sure why. Should investigate, cos it's noticably inconsistent.
        return {
            ...transform,
            x: transform.x + (activatorCoordinates.x - draggingNodeRect.left - draggingNodeRect.width / 2),
            y: transform.y + (activatorCoordinates.y - draggingNodeRect.top),
        };
    }
    return transform;
};

const clearFocus = () => {
    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
};

type Props = {
    children: ReactNode;
    onCardDropped: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
};

type ChoiceInfo = {
    choiceCardId: number;
    options: CardType[];
};

export const DragCardProvider = ({ children, onCardDropped }: Props) => {
    const [activeCard, setActiveCard] = useState<ActiveCardInfo | null>(null);
    const [isOverValidTarget, setIsOverValidTarget] = useState(false);
    const [choice, setChoice] = useState<ChoiceInfo | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current as ActiveCardInfo | undefined;
        if (data) {
            setActiveCard({
                id: data.id,
                targetType: data.targetType,
                cardType: data.cardType,
            });
        }

        // Blur the currently focused element, because another card might be focused.
        clearFocus();
    };

    const handleDragOver = (event: { over: { id: string | number; disabled?: boolean } | null }) => {
        // Check if we're over a valid (not disabled) drop target
        setIsOverValidTarget(!!event.over && !event.over.disabled);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const cardId = event.active.id;

        if (event.over?.id && typeof cardId === 'number' && activeCard) {
            // Recalculate allowed using the latest activeCard and drop target type.
            const dropData = event.over.data.current;
            if (dropData) {
                const targetType = dropData.targetType;
                const allowed = dropData.acceptAnyCardType || targetType === activeCard.targetType;

                if (allowed) {
                    if (targetType === 'choice') {
                        const options = (getCardDefinition(activeCard.cardType) as ChoiceCardDefinition).cards;
                        setChoice({ choiceCardId: cardId, options });
                    } else {
                        if (choice) {
                            setChoice(null);
                        }
                        onCardDropped(cardId, activeCard.cardType, targetType, String(event.over.id));
                    }
                }
            }
        }

        // Blur the currently focused element (which is the dragged element)
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }

        setIsOverValidTarget(false);
        setActiveCard(null);
    };

    const handleDragCancel = () => {
        // Blur the currently focused element.
        clearFocus();

        setIsOverValidTarget(false);
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
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            modifiers={[snapTopCenterToCursor]}
        >
            <ActiveCardContext.Provider value={{ activeCard, isOverValidTarget }}>
                <CardDropTarget
                    id="noTarget"
                    targetType="no-target"
                />
                <CardDropTarget
                    id="choiceTarget"
                    targetType="choice"
                />
                {children}
                {/* choice && (
                    <CardChoice
                        // TODO: the choice component needs to fade out (ALMOST?) completely when dragging a choice card.
                        cardId={choice.choiceCardId}
                        cardTypes={choice.options}
                        onCancel={() => setChoice(null)}
                    />
                ) */}
                <DragOverlay />
            </ActiveCardContext.Provider>
        </DndContext>
    );
};
