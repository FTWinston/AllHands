import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { NonEncounterCardInfo } from 'common-data/features/cards/types/NonEncounterCardInfo';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { getNonEncounterCardDefinition } from 'common-ui/features/cards/utils/getNonEncounterCardDefinition';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import cardHandStyles from 'src/features/cardui/components/CardHand.module.css';
import { DraggableCard } from 'src/features/cardui/components/DraggableCard';
import { useArrayChanges } from 'src/hooks/useArrayChanges';
import type { Snapshot } from '@colyseus/react';

type Props = {
    cards: Snapshot<NonEncounterCardInfo[]>;
    system: ShipSystem;
};

const getCardId = (card: Snapshot<NonEncounterCardInfo>) => card.id;

/** Lays out non-encounter cards the same way as a hand of cards. */
export const NonEncounterHand: FC<Props> = ({ cards, system }) => {
    const { knownItems: knownCards, currentItemIds: inHandCardIds, removingItemIds: removingCardIds } = useArrayChanges(cards, getCardId);

    return (
        <div
            className={cardHandStyles.hand}
            style={{
                // @ts-expect-error CSS custom property
                '--numCards': knownCards.length,
            }}
        >
            {knownCards.map((card, index) => (
                <DraggableCard
                    key={card.id}
                    id={card.id}
                    // Not a card definition, so `definition` is what is displayed; the kind only identifies the card while it is dragged.
                    type={card.kind as CardType}
                    definition={getNonEncounterCardDefinition(card, system)}
                    availablePower={0}
                    index={index}
                    extraTraits={card.playable ? undefined : { unplayable: ExtraTraitType.Normal }}
                    className={classNames(
                        cardHandStyles.card,
                        removingCardIds.has(card.id) ? cardHandStyles.removing : inHandCardIds.has(card.id) ? null : cardHandStyles.adding
                    )}
                />
            ))}
        </div>
    );
};
