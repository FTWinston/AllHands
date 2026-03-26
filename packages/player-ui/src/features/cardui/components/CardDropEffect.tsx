import { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import { CardDisplay } from 'common-ui/features/cards/components/CardDisplay';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { FC } from 'react';
import styles from './CardDropEffect.module.css';

export type DroppedCardEffect = {
    id: number;
    cardType: CardType;
    x: number;
    y: number;
};

type Props = {
    effect: DroppedCardEffect;
    onComplete: () => void;
};

export const CardDropEffect: FC<Props> = ({ effect, onComplete }) => {
    const definition = getCardDefinition(effect.cardType);

    return (
        <div
            className={styles.effectContainer}
            style={{
                left: effect.x,
                top: effect.y,
            }}
        >
            <div className={styles.effectCard} onAnimationEnd={onComplete}>
                <CardDisplay {...definition} sufficientPower />
            </div>
        </div>
    );
};
