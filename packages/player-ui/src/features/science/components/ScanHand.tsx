import { Snapshot } from '@colyseus/react';
import { CardInstance } from 'common-data/features/cards/types/CardInstance';
import { InfoPopup } from 'common-ui/components/InfoPopup';
import { RestrictedHeightText } from 'common-ui/components/RestrictedHeightText';
import crewStyles from 'common-ui/CrewColors.module.css';
import { Card } from 'common-ui/features/cards/components/Card';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { default as CardsIcon } from 'common-ui/icons/cards.svg?react';
import { classNames } from 'common-ui/utils/classNames';
import styles from './ScanHand.module.css';

type Props = {
    className?: string;
    cards: Snapshot<CardInstance[]>;
};

const HandCard = ({ card }: { card: Snapshot<CardInstance> }) => {
    const cardDef = getCardDefinition(card.type);
    const isDamaged = card.extraTraits?.['damaged'] !== undefined || card.extraTraits?.['critical'] !== undefined;

    return (
        <li className={styles.item}>
            <InfoPopup
                className={classNames(styles.card, crewStyles[cardDef.system], isDamaged ? styles.damaged : null)}
                description={<Card {...card} disabled={true} />}
            >
                <RestrictedHeightText className={styles.cardName} fitWidth>{cardDef.name}</RestrictedHeightText>
            </InfoPopup>
        </li>
    );
};

/** The cards in a scanned system's hand, once science has read it: what it's about to do. Each can be tapped to show the whole card. */
export const ScanHand = (props: Props) => (
    <div className={classNames(styles.root, props.className)}>
        <CardsIcon className={styles.icon} role="img" aria-label="Hand" />

        {props.cards.length > 0
            ? (
                <ol className={styles.cards} aria-label="Scanned hand">
                    {props.cards.map(card => <HandCard key={card.id} card={card} />)}
                </ol>
            )
            : <span className={styles.empty}>No cards in hand</span>}
    </div>
);
