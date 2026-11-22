import crewStyles from 'common-ui/CrewColors.module.css';
import { Card } from 'common-ui/features/cards/components/Card';
import { crewRoleLabels } from 'common-ui/features/crew/utils/crewRoleLabels';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import styles from './SalvageDisplay.module.css';
import type { Snapshot } from '@colyseus/react';
import type { SalvageCardInfo } from 'common-data/features/cards/types/CardRewardInfo';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

type Props = {
    cards: Snapshot<SalvageCardInfo[]>;
    /** The crew member who chooses which card the ship takes, on their own console. */
    chooser: CrewRoleName;
};

/**
 * The cards salvaged after a fight, for everyone on the bridge to see and argue over, while the crew member who can't benefit from them chooses.
 * Each shows who it's for, and how full their deck is.
 */
export const SalvageDisplay: FC<Props> = ({ cards, chooser }) => (
    <section className={styles.root} aria-label="Salvage">
        <h2 className={styles.heading}>
            Salvage
            <span className={classNames(styles.chooser, crewStyles[chooser])}>{`${crewRoleLabels[chooser].name} chooses`}</span>
        </h2>

        <ul className={styles.cards}>
            {cards.map(({ role, card, deckSize, maxDeckSize }) => (
                <li key={card.id} className={classNames(styles.item, crewStyles[role])}>
                    <span className={styles.recipient}>
                        {crewRoleLabels[role].name}
                        <span className={classNames(styles.deckSize, deckSize >= maxDeckSize ? styles.full : null)}>
                            {deckSize >= maxDeckSize ? `Deck full ${deckSize}/${maxDeckSize}` : `Deck ${deckSize}/${maxDeckSize}`}
                        </span>
                    </span>
                    <div className={styles.card}>
                        <Card type={card.type} showTraitDescriptions />
                    </div>
                </li>
            ))}
        </ul>
    </section>
);
