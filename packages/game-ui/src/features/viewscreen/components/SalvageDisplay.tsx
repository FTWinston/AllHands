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
 * The cards that can be made from what the ship tractored in at the end of a fight, shown over the sector map once it has warped away,
 * for everyone on the bridge to see and argue over, while the crew member who can't benefit from them chooses.
 * Each shows who it's for, and how full their deck is. The chooser can hold a button to hide this, so the crew can see the map behind it.
 */
export const SalvageDisplay: FC<Props> = ({ cards, chooser }) => (
    <div className={styles.backdrop}>
        <section className={styles.root} aria-label="Salvage">
            <h2 className={styles.heading}>
                Salvage
                <span className={classNames(styles.chooser, crewStyles[chooser])}>{`${crewRoleLabels[chooser].name} chooses`}</span>
            </h2>

            <p className={styles.text}>
                What the ship tractored in at the end of the fight can make one of these. Helm can&apos;t plot a course until it&apos;s chosen.
            </p>

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
                            <Card type={card.type} />
                        </div>
                    </li>
                ))}
            </ul>

            <p className={styles.hint}>{`${crewRoleLabels[chooser].name} can hold a button on their console to see the map.`}</p>
        </section>
    </div>
);
