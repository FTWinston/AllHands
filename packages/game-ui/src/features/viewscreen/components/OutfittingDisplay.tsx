import { bundleVotesNeeded } from 'common-data/features/cards/utils/cardRewardCounts';
import { crewRoleNames, type CrewRoleName } from 'common-data/features/ships/types/CrewRole';
import crewStyles from 'common-ui/CrewColors.module.css';
import { Card } from 'common-ui/features/cards/components/Card';
import { crewRoleLabels } from 'common-ui/features/crew/utils/crewRoleLabels';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import styles from './OutfittingDisplay.module.css';
import type { Snapshot } from '@colyseus/react';
import type { OutfitBundleInfo } from 'common-data/features/cards/types/CardRewardInfo';

type Props = {
    /** The bundles on offer after the first sector. With none, each crew member is choosing a card of their own. */
    bundles: Snapshot<OutfitBundleInfo[]>;
    /** The index of the bundle each crew member has voted for, by role. */
    votes: Readonly<Partial<Record<CrewRoleName, number>>>;
};

/**
 * What an outfitting station offers the crew. After the first sector, that's a few bundles, each a two-by-two grid of a card for every crew member,
 * with one standout card, for the crew to weigh up and vote on. Each crew member reads their own card in full on their console.
 */
export const OutfittingDisplay: FC<Props> = ({ bundles, votes }) => {
    if (bundles.length === 0) {
        return (
            <p className={styles.picking}>Each crew member is choosing a new card for their station.</p>
        );
    }

    return (
        <section className={styles.root} aria-label="Outfitting bundles">
            <p className={styles.instructions}>{`Each bundle has a card for every crew member. Vote on your console: once ${bundleVotesNeeded} of you agree, everyone gets their card from it.`}</p>

            <ul className={styles.bundles}>
                {bundles.map((bundle, index) => {
                    const voters = crewRoleNames.filter(role => votes[role] === index);

                    return (
                        <li key={index} className={styles.bundle} aria-label={`Bundle ${index + 1}`}>
                            <h2 className={styles.bundleName}>{`Bundle ${index + 1}`}</h2>

                            <ul className={styles.grid}>
                                {bundle.cards.map(({ role, card }) => (
                                    <li key={role} className={classNames(styles.item, crewStyles[role], role === bundle.standout ? styles.standout : null)}>
                                        <span className={styles.role}>
                                            {crewRoleLabels[role].name}
                                            {role === bundle.standout && <span className={styles.standoutLabel}>Standout</span>}
                                        </span>
                                        <div className={styles.card}>
                                            <Card type={card.type} />
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <ul className={styles.voters} aria-label={`Votes for bundle ${index + 1}`}>
                                {voters.map(role => (
                                    <li key={role} className={classNames(styles.voter, crewStyles[role])}>{crewRoleLabels[role].name}</li>
                                ))}
                            </ul>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};
