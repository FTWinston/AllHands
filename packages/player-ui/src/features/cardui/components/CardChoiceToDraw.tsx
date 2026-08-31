import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { Button } from 'common-ui/components/Button';
import { CardDisplay } from 'common-ui/features/cards/components/CardDisplay';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { classNames } from 'common-ui/utils/classNames';
import { FC, useState } from 'react';
import styles from './CardChoiceToDraw.module.css';

type Props = {
    cards: Snapshot<CardInstance[]>;
    onChoose: (cardId: number) => void;
};

/**
 * A mandatory, server-triggered choice presented when a system reveals cards from its draw
 * pile: the chosen card goes to hand, the rest are discarded. Unlike CardChoiceToPlay, the
 * cards here aren't draggable and there's no way to cancel out of the choice.
 */
export const CardChoiceToDraw: FC<Props> = ({ cards, onChoose }) => {
    const [selectedId, setSelectedId] = useState<number | null>(null);

    return (
        <div className={styles.choiceRoot}>
            <h2 className={styles.title}>Choose a card to draw:</h2>
            <div
                className={styles.cards}
                style={{
                    // @ts-expect-error CSS custom property
                    '--numCards': cards.length,
                }}
            >
                {cards.map((card, index) => {
                    const definition = getCardDefinition(card.type);
                    const isSelected = selectedId === card.id;

                    return (
                        <button
                            key={card.id}
                            type="button"
                            onClick={() => setSelectedId(card.id)}
                            className={classNames(styles.card, isSelected ? styles.selected : null)}
                            style={{
                                // @ts-expect-error CSS custom property
                                '--index': index,
                            }}
                        >
                            <CardDisplay {...definition} highlighted={isSelected} />
                        </button>
                    );
                })}
            </div>

            <Button
                onClick={() => selectedId !== null && onChoose(selectedId)}
                disabled={selectedId === null}
                className={styles.okButton}
            >
                OK
            </Button>
        </div>
    );
};
