import { ExtraTraitType } from 'common-data/features/cards/types/ExtraTraitType';
import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CrewRole } from 'common-data/features/ships/types/CrewRole';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import cardHandStyles from 'src/features/cardui/components/CardHand.module.css';
import { DraggableCard } from 'src/features/cardui/components/DraggableCard';
import { useArrayChanges } from 'src/hooks/useArrayChanges';
import { getLobbyCardDefinition, LobbyCard, lobbyCards } from './lobbyCards';

type Props = {
    cards: LobbyCard[];
    isOccupied: (role: CrewRole) => boolean;
    /** While this player holds a role, the rest of their cards can't be played until it is released. */
    hasRole: boolean;
};

const getCardId = (card: LobbyCard) => card.id;

const damagedTraits = { damaged: ExtraTraitType.Normal };

/**
 * Lays out the lobby's system cards the same way as a hand of cards.
 * Systems occupied by someone else cost more power than is available, and the rest are shown as damaged while this player holds a role.
 */
export const LobbyHand: FC<Props> = ({ cards, isOccupied, hasRole }) => {
    const { knownItems, currentItemIds: inHandCardIds, removingItemIds: removingCardIds } = useArrayChanges(cards, getCardId);

    // A released card returns to its usual place, rather than the end of the hand.
    const knownCards = lobbyCards.filter(card => knownItems.some(known => known.id === card.id));

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
                    // Not a card definition, so `definition` is what is displayed; the type only identifies the card while it is dragged.
                    type={card.system as CardType}
                    definition={getLobbyCardDefinition(card.system, isOccupied(card.id))}
                    extraTraits={hasRole ? damagedTraits : undefined}
                    availablePower={0}
                    index={index}
                    className={classNames(
                        cardHandStyles.card,
                        removingCardIds.has(card.id) ? cardHandStyles.removing : inHandCardIds.has(card.id) ? null : cardHandStyles.adding
                    )}
                />
            ))}
        </div>
    );
};
