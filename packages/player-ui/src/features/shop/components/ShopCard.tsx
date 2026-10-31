import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { Card } from 'common-ui/features/cards/components/Card';
import { FC, ReactNode, useState } from 'react';
import cardGridStyles from 'src/features/cardui/components/CardGrid.module.css';

type Props = {
    card: Snapshot<CardInstance>;
    /** Shown beneath the card only while it's focused, and so zoomed in, e.g. a button to choose it. */
    action?: ReactNode;
};

/** A card on offer (e.g. for sale, or delivered by a work order) in a card grid, which zooms in when hovered or focused. */
export const ShopCard: FC<Props> = ({ card, action }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div
            className={cardGridStyles.card}
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Focusing a card zooms in and shows its trait descriptions, as tapping one in a hand does.
            tabIndex={0}
            onFocus={() => setIsFocused(true)}
            // Focus moving to its action doesn't count as leaving it.
            onBlur={e => setIsFocused(e.currentTarget.contains(e.relatedTarget))}
        >
            <Card
                type={card.type}
                modifiers={card.modifiers}
                extraTraits={card.extraTraits}
                showTraitDescriptions={isFocused}
            />

            {action && <div className={cardGridStyles.action}>{action}</div>}
        </div>
    );
};
