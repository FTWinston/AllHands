import { ChoiceCardDefinition } from 'common-data/features/cards/types/CardDefinition';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { MinimalReadonlyArray } from 'common-data/types/MinimalArray';
import { getCardDefinition } from 'engine/cards/getEngineCardDefinition';
import { FC, PropsWithChildren, useCallback, useState } from 'react';
import { CardChoice } from './CardChoice';
import { CardDropTarget } from './CardDropTarget';
import { CardHand } from './CardHand';
import { DragCardProvider } from './DragCardProvider';

type Props = PropsWithChildren<{
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
export const CardUI: FC<Props> = ({ playCard, cardHand, children }) => {
    const [choice, setChoice] = useState<ChoiceInfo | null>(null);

    const dropCard = useCallback((cardId: number, cardType: CardType, targetType: CardTargetType, targetId: string) => {
        if (targetType === 'choice') {
            const choiceCardDefinition = getCardDefinition(cardType) as ChoiceCardDefinition;
            setChoice({
                choiceCardId: cardId,
                options: choiceCardDefinition.cards,
            });
        } else {
            setChoice(null);
            playCard(cardId, cardType, targetType, targetId);
        }
    }, [playCard]);

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
                <CardChoice
                    cardId={choice.choiceCardId}
                    cardTypes={choice.options}
                    onCancel={() => setChoice(null)}
                />
            )}
            <CardHand cards={cardHand} />
        </DragCardProvider>
    );
};
