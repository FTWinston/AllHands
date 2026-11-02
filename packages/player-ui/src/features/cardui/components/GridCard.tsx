import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { Card } from 'common-ui/features/cards/components/Card';
import { classNames } from 'common-ui/utils/classNames';
import { FC, HTMLAttributes, ReactNode, Ref, SyntheticEvent, useState } from 'react';
import cardGridStyles from './CardGrid.module.css';

type Props = Omit<HTMLAttributes<HTMLDivElement>, 'onFocus' | 'onBlur'> & {
    card: Snapshot<CardInstance>;
    /** Shown beneath the card only while it's focused, and so zoomed in, e.g. a button to choose it. */
    action?: ReactNode;
    /** Greyed out, e.g. as it can't be chosen. It can still be focused, to zoom in and read it. */
    disabled?: boolean;
    /** Hide its trait descriptions even while it's focused, e.g. while it's being dragged. */
    hideTraitDescriptions?: boolean;
    ref?: Ref<HTMLDivElement>;
};

/** Pressing its action shouldn't also start dragging the card. */
const stopPropagation = (e: SyntheticEvent) => e.stopPropagation();

/** A card in a card grid (e.g. for sale, delivered by a work order, or in a deck), which zooms in when hovered or focused. */
export const GridCard: FC<Props> = ({ card, action, disabled, hideTraitDescriptions, className, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <div
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- Focusing a card zooms in and shows its trait descriptions, as tapping one in a hand does.
            tabIndex={0}
            {...props}
            className={classNames(cardGridStyles.card, className)}
            onFocus={() => setIsFocused(true)}
            // Focus moving to its action doesn't count as leaving it.
            onBlur={e => setIsFocused(e.currentTarget.contains(e.relatedTarget))}
        >
            <Card
                type={card.type}
                modifiers={card.modifiers}
                extraTraits={card.extraTraits}
                showTraitDescriptions={isFocused && !hideTraitDescriptions}
                disabled={disabled}
            />

            {action && (
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Only stops presses on its action from reaching the card.
                <div className={cardGridStyles.action} onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                    {action}
                </div>
            )}
        </div>
    );
};
