import { Snapshot } from '@colyseus/react';
import { ChoiceCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { FC, PropsWithChildren, useCallback, useState } from 'react';
import { CardChoiceToDraw } from './CardChoiceToDraw';
import { CardChoiceToPlay } from './CardChoiceToPlay';
import { CardDropTarget } from './CardDropTarget';
import { CardHand } from './CardHand';
import { DragCardProvider } from './DragCardProvider';

type Props = PropsWithChildren<{
    availablePower: number;
    playCard: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    cardHand: Snapshot<CardInstance[]>;
    onAlternateDrop?: (targetId: string) => void;
    pendingDrawChoice: Snapshot<CardInstance[]>;
    resolveDrawChoice: (cardId: number) => void;
    /**
     * Determines whether a given card in the hand should be visually highlighted, e.g. to indicate that
     * playing it would have some notable effect. Different consumers of CardUI can supply their own logic here.
     */
    isCardHighlighted?: (card: Snapshot<CardInstance>) => boolean;
}>;

type ChoiceInfo = {
    choiceCardId: number;
    options: Snapshot<CardType[]>;
};

/**
 * The full UI for displaying and interacting with a hand of cards.
 * Any CardDropTarget components these cards should interact with should be nested within this component.
 */
export const CardUI: FC<Props> = ({ playCard, cardHand, availablePower, children, onAlternateDrop, pendingDrawChoice, resolveDrawChoice, isCardHighlighted }) => {
    const [playChoice, setPlayChoice] = useState<ChoiceInfo | null>(null);

    const dropCard = useCallback((cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => {
        if (targetType === 'choice') {
            const choiceCardDefinition = getCardDefinition(cardType) as Snapshot<ChoiceCardDefinition>;

            // Only show the choice if the player has enough power to do so.
            if (availablePower >= choiceCardDefinition.parameters.cost) {
                setPlayChoice({
                    choiceCardId: cardId,
                    options: choiceCardDefinition.cards,
                });
            }
        } else {
            setPlayChoice(null);
            playCard(cardId, cardType, targetType, targetId);
        }
    }, [playCard, availablePower]);

    const hasDrawChoice = pendingDrawChoice.length > 0;

    return (
        <DragCardProvider onCardDropped={dropCard} onAlternateDrop={onAlternateDrop}>
            <CardDropTarget
                id="noTarget"
                targetType="no-target"
            />
            <CardDropTarget
                id="choiceTarget"
                targetType="choice"
            />

            {children}

            {playChoice && (
                <CardChoiceToPlay
                    cardId={playChoice.choiceCardId}
                    cardTypes={playChoice.options}
                    availablePower={availablePower}
                    onCancel={() => setPlayChoice(null)}
                />
            )}

            <CardHand
                cards={cardHand}
                availablePower={availablePower}
                shiftDown={!!playChoice || hasDrawChoice}
                isCardHighlighted={isCardHighlighted}
            />

            {hasDrawChoice && !playChoice && (
                <CardChoiceToDraw
                    cards={pendingDrawChoice}
                    onChoose={resolveDrawChoice}
                />
            )}
        </DragCardProvider>
    );
};
