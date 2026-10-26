import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { Button } from 'common-ui/components/Button';
import { ConfirmDialog } from 'common-ui/components/ConfirmDialog';
import { Card } from 'common-ui/features/cards/components/Card';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { default as AntimatterIcon } from 'common-ui/icons/antimatter.svg?react';
import { classNames } from 'common-ui/utils/classNames';
import { FC, useState } from 'react';
import cardGridStyles from 'src/features/cardui/components/CardGrid.module.css';
import styles from './DeckCardList.module.css';
import type { Snapshot } from '@colyseus/react';

type Props = {
    /** In draw order. */
    cards: Snapshot<CardInstance[]>;
    /** When provided, cards can be dragged to a new position. */
    onMoveCard?: (cardId: number, toIndex: number) => void;
    /** When provided, each card has a button to sell it for `sellPrice`, once confirmed. */
    onSellCard?: (cardId: number) => void;
    sellPrice?: number;
    /** Selling is disabled while this is set. */
    sellDisabled?: boolean;
};

type PendingMove = {
    source: Snapshot<CardInstance[]>;
    order: Snapshot<CardInstance>[];
};

/** Dropping a card on a slot inserts it before the card at that index, or at the end of the deck for the slot after the last card. */
const slotPrefix = 'slot-';

/** A crew member's deck cards in a grid, each with its position, optionally allowing cards to be re-ordered by dragging and sold. Cards zoom to full size when hovered or focused. */
export const DeckCardList: FC<Props> = (props) => {
    const { cards, onMoveCard, onSellCard } = props;

    // Show a move straight away, until the server's updated deck arrives.
    const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
    const displayedCards = pendingMove?.source === cards ? pendingMove.order : cards;

    const [draggingCard, setDraggingCard] = useState<Snapshot<CardInstance> | null>(null);
    const draggingIndex = draggingCard ? displayedCards.indexOf(draggingCard) : -1;

    // Kept once the confirmation closes, so its prompt doesn't change as it fades out.
    const [sellingCard, setSellingCard] = useState<Snapshot<CardInstance> | null>(null);
    const [isConfirmingSell, setConfirmingSell] = useState(false);

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

        const slotIndex = Number(overId.substring(slotPrefix.length));
        const fromIndex = displayedCards.findIndex(card => card.id === cardId);

        // Taking the card out first moves every later card back one.
        const toIndex = slotIndex > fromIndex ? slotIndex - 1 : slotIndex;
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
            <div className={cardGridStyles.scale}>
                <ol className={classNames(cardGridStyles.grid, draggingCard ? cardGridStyles.noZoom : null)} aria-label="Deck">
                    {displayedCards.map((card, index) => (
                        <DeckCardItem
                            key={card.id}
                            card={card}
                            index={index}
                            canMove={!!onMoveCard}
                            // Dropping either side of the card being dragged would leave it where it is.
                            isMoveTarget={draggingIndex !== -1 && index !== draggingIndex && index !== draggingIndex + 1}
                            onSell={onSellCard
                                ? () => {
                                    setSellingCard(card);
                                    setConfirmingSell(true);
                                }
                                : undefined}
                            sellPrice={props.sellPrice}
                            sellDisabled={props.sellDisabled}
                        />
                    ))}

                    {draggingCard && (
                        <DeckEndSlot
                            index={displayedCards.length}
                            isMoveTarget={draggingIndex !== displayedCards.length - 1}
                        />
                    )}
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

            {onSellCard && sellingCard && (
                <ConfirmDialog
                    title="Sell card"
                    prompt={`Sell ${getCardDefinition(sellingCard.type).name} for ${props.sellPrice} antimatter? It will be removed from your deck.`}
                    isOpen={isConfirmingSell}
                    setOpen={setConfirmingSell}
                    confirm={() => onSellCard(sellingCard.id)}
                />
            )}
        </DndContext>
    );
};

type ItemProps = {
    card: Snapshot<CardInstance>;
    index: number;
    canMove: boolean;
    /** Whether dropping the card being dragged here would move it. */
    isMoveTarget: boolean;
    onSell?: () => void;
    sellPrice?: number;
    sellDisabled?: boolean;
};

const DeckCardItem: FC<ItemProps> = ({ card, index, canMove, isMoveTarget, onSell, sellPrice, sellDisabled }) => {
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `${slotPrefix}${index}`, disabled: !canMove });
    const { setNodeRef: setDragRef, attributes, listeners, isDragging } = useDraggable({ id: card.id, disabled: !canMove });

    const [isFocused, setIsFocused] = useState(false);

    return (
        <li
            ref={setDropRef}
            className={classNames(cardGridStyles.item, isOver && isMoveTarget ? styles.dropTarget : null)}
        >
            <div className={styles.position}>
                #
                {index + 1}
            </div>

            <div
                ref={setDragRef}
                className={classNames(cardGridStyles.card, canMove ? styles.movable : null, isDragging ? styles.dragging : null)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                // Focusable even when not movable, so it can be tapped to zoom in.
                {...(canMove ? { ...listeners, ...attributes } : { tabIndex: 0 })}
            >
                <Card
                    type={card.type}
                    modifiers={card.modifiers}
                    extraTraits={card.extraTraits}
                    showTraitDescriptions={isFocused && !isDragging}
                />
            </div>

            {onSell && (
                <Button
                    className={styles.sell}
                    palette="danger"
                    disabled={sellDisabled}
                    onClick={onSell}
                    aria-label={`Sell for ${sellPrice} antimatter`}
                    endIcon={<AntimatterIcon />}
                >
                    {`Sell ${sellPrice}`}
                </Button>
            )}
        </li>
    );
};

type EndSlotProps = {
    index: number;
    isMoveTarget: boolean;
};

/** Shown while dragging, after the last card, to move a card to the end of the deck. */
const DeckEndSlot: FC<EndSlotProps> = ({ index, isMoveTarget }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `${slotPrefix}${index}`, disabled: !isMoveTarget });

    return (
        <li ref={setNodeRef} className={classNames(cardGridStyles.item, styles.endSlot, isOver ? styles.dropTarget : null)}>
            <div className={styles.endSlotLabel}>End of deck</div>
        </li>
    );
};
