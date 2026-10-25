import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { Button } from 'common-ui/components/Button';
import { Card } from 'common-ui/features/cards/components/Card';
import { classNames } from 'common-ui/utils/classNames';
import { FC, useState } from 'react';
import styles from './DeckCardList.module.css';
import type { Snapshot } from '@colyseus/react';

type Props = {
    /** In draw order. */
    cards: Snapshot<CardInstance[]>;
    /** When provided, cards can be dragged to a new position. */
    onMoveCard?: (cardId: number, toIndex: number) => void;
    /** When provided, each card has a button to sell it for `sellPrice`. */
    onSellCard?: (cardId: number) => void;
    sellPrice?: number;
    /** Selling is disabled while this is set. */
    sellDisabled?: boolean;
};

type PendingMove = {
    source: Snapshot<CardInstance[]>;
    order: Snapshot<CardInstance>[];
};

const slotPrefix = 'slot-';

/** A crew member's deck cards in a grid, each with its position, optionally allowing cards to be re-ordered by dragging and sold. */
export const DeckCardList: FC<Props> = (props) => {
    const { cards, onMoveCard } = props;

    // Show a move straight away, until the server's updated deck arrives.
    const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
    const displayedCards = pendingMove?.source === cards ? pendingMove.order : cards;

    const [draggingCard, setDraggingCard] = useState<Snapshot<CardInstance> | null>(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        // A long press starts a drag on touch screens, so the list can still be scrolled.
        useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setDraggingCard(displayedCards.find(card => card.id === event.active.id) ?? null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setDraggingCard(null);

        const cardId = event.active.id as number;
        const overId = event.over?.id;
        if (typeof overId !== 'string' || !overId.startsWith(slotPrefix)) {
            return;
        }

        const toIndex = Number(overId.substring(slotPrefix.length));
        const fromIndex = displayedCards.findIndex(card => card.id === cardId);
        if (fromIndex === -1 || fromIndex === toIndex) {
            return;
        }

        const order = [...displayedCards];
        const [card] = order.splice(fromIndex, 1);
        order.splice(toIndex, 0, card);
        setPendingMove({ source: cards, order });

        onMoveCard?.(cardId, toIndex);
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setDraggingCard(null)}
        >
            <div className={styles.deck}>
                <ol className={styles.list} aria-label="Deck">
                    {displayedCards.map((card, index) => (
                        <DeckCardItem
                            key={card.id}
                            card={card}
                            index={index}
                            canMove={!!onMoveCard}
                            onSell={props.onSellCard}
                            sellPrice={props.sellPrice}
                            sellDisabled={props.sellDisabled}
                        />
                    ))}
                </ol>

                <DragOverlay>
                    {draggingCard && (
                        <Card
                            type={draggingCard.type}
                            modifiers={draggingCard.modifiers}
                            extraTraits={draggingCard.extraTraits}
                            className={styles.draggingCard}
                        />
                    )}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

type ItemProps = {
    card: Snapshot<CardInstance>;
    index: number;
    canMove: boolean;
    onSell?: (cardId: number) => void;
    sellPrice?: number;
    sellDisabled?: boolean;
};

const DeckCardItem: FC<ItemProps> = ({ card, index, canMove, onSell, sellPrice, sellDisabled }) => {
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `${slotPrefix}${index}`, disabled: !canMove });
    const { setNodeRef: setDragRef, attributes, listeners, isDragging } = useDraggable({ id: card.id, disabled: !canMove });

    return (
        <li
            ref={setDropRef}
            className={classNames(styles.item, isOver && !isDragging ? styles.dropTarget : null)}
        >
            <div className={styles.position}>
                #
                {index + 1}
            </div>

            <div
                ref={setDragRef}
                className={classNames(styles.card, canMove ? styles.movable : null, isDragging ? styles.dragging : null)}
                {...(canMove ? { ...listeners, ...attributes } : {})}
            >
                <Card
                    type={card.type}
                    modifiers={card.modifiers}
                    extraTraits={card.extraTraits}
                />
            </div>

            {onSell && (
                <Button
                    className={styles.sell}
                    palette="danger"
                    disabled={sellDisabled}
                    onClick={() => onSell(card.id)}
                >
                    Sell (+
                    {sellPrice}
                    )
                </Button>
            )}
        </li>
    );
};
