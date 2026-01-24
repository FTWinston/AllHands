import { ChoiceCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { FC, PropsWithChildren, useCallback, useState } from 'react';
import { CardChoiceToPlay } from './CardChoiceToPlay';
import { CardDropTarget } from './CardDropTarget';
import { CardHand } from './CardHand';
import { DragCardProvider } from './DragCardProvider';

type Props = PropsWithChildren<{
    power: number;
    playCard: (cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => void;
    cardHand: MinimalReadonlyArray<CardInstance>;
}>;

type ChoiceInfo = {
    choiceCardId: number;
    options: CardType[];
};

/**
 * The full UI for displaying and interacting with a hand of cards.
 * Any CardDropTarget components these cards should interact with should be nested within this component.
 */
export const CardUI: FC<Props> = ({ playCard, cardHand, power, children }) => {
    const [choice, setChoice] = useState<ChoiceInfo | null>(null);

    const dropCard = useCallback((cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => {
        if (targetType === 'choice') {
            const choiceCardDefinition = getCardDefinition(cardType) as ChoiceCardDefinition;

            // Only show the choice if the player has enough power to do so.
            if (power >= choiceCardDefinition.cost) {
                setChoice({
                    choiceCardId: cardId,
                    options: choiceCardDefinition.cards,
                });
            }
        } else {
            setChoice(null);
            playCard(cardId, cardType, targetType, targetId);
        }
    }, [playCard, power]);

    return (
        <DragCardProvider onCardDropped={dropCard}>
            <CardDropTarget
                id="noTarget"
                targetType="no-target"
            />
            <CardDropTarget
                id="choiceTarget"
                targetType="choice"
            />

            {children}

            {choice && (
                <CardChoiceToPlay
                    cardId={choice.choiceCardId}
                    cardTypes={choice.options}
                    power={power}
                    onCancel={() => setChoice(null)}
                />
            )}

            <CardHand
                cards={cardHand}
                power={power}
                shiftDown={!!choice}
            />
        </DragCardProvider>
    );
};
