import { Button } from 'common-ui/components/Button';
import crewStyles from 'common-ui/CrewColors.module.css';
import { crewRoleLabels } from 'common-ui/features/crew/utils/crewRoleLabels';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import cardGridStyles from 'src/features/cardui/components/CardGrid.module.css';
import { GridCard } from 'src/features/cardui/components/GridCard';
import shopStyles from 'src/features/shop/components/ShopPanel.module.css';
import styles from './RewardPanels.module.css';
import type { BundleOption } from '../types/RewardsModel';

type Props = {
    bundles: readonly BundleOption[];
    /** The index of the bundle this crew member voted for, or null. */
    vote: number | null;
    votesNeeded: number;
    voteBundle: (bundleIndex: number) => void;
};

/**
 * At an outfitting station after the first sector: the card each bundle would give this crew member, and who has voted for it.
 * Every crew member gets their card from whichever bundle the crew agrees on. The main viewscreen shows the whole bundles.
 */
export const BundleVotePanel: FC<Props> = ({ bundles, vote, votesNeeded, voteBundle }) => (
    <section className={classNames(shopStyles.panel, styles.outfitting, cardGridStyles.scale)} aria-label="Outfitting bundles">
        <h2 className={shopStyles.title}>Outfitting bundles</h2>

        <p className={shopStyles.instructions}>
            {`Each bundle has a card for every crew member. These are yours: the main screen shows everyone's. Vote for a bundle, and once ${votesNeeded} of you agree, everyone gets their card from it.`}
        </p>

        <ul className={classNames(cardGridStyles.grid, styles.bundles)} aria-label="Bundles">
            {bundles.map(({ index, card, standout, voters }) => {
                const voted = vote === index;

                return (
                    <li key={card.id} className={classNames(cardGridStyles.item, voted ? styles.voted : null)}>
                        <span className={styles.bundleName}>
                            {`Bundle ${index + 1}`}
                            {standout && <span className={styles.standout}>Standout</span>}
                        </span>

                        <GridCard
                            card={card}
                            action={(
                                <Button palette="good" disabled={voted} onClick={() => voteBundle(index)}>
                                    {voted ? 'Voted' : 'Vote'}
                                </Button>
                            )}
                        />

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
