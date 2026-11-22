import { cardSellPrice } from 'common-data/features/ships/utils/antimatter';
import { Button } from 'common-ui/components/Button';
import crewStyles from 'common-ui/CrewColors.module.css';
import { crewRoleLabels } from 'common-ui/features/crew/utils/crewRoleLabels';
import { default as AntimatterIcon } from 'common-ui/icons/antimatter.svg?react';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import cardGridStyles from 'src/features/cardui/components/CardGrid.module.css';
import { GridCard } from 'src/features/cardui/components/GridCard';
import styles from './SalvagePrompt.module.css';
import type { SalvageModel } from '../types/RewardsModel';

/**
 * Shown to the crew member who chooses which salvaged card the ship takes, once a fight's objective is met. The main viewscreen shows the same cards to everyone.
 * None of them is for this crew member, so they have to ask the others what would help. It covers the rest of the screen until they choose,
 * as helm can't warp away until then.
 */
export const SalvagePrompt: FC<SalvageModel> = ({ cards, takeSalvage, scrapSalvage }) => (
    <div className={styles.backdrop}>
        <section className={classNames(styles.prompt, cardGridStyles.scale)} role="alertdialog" aria-modal="true" aria-labelledby="salvage-title" aria-describedby="salvage-text">
            <h2 id="salvage-title" className={styles.title}>Salvage</h2>
            <p id="salvage-text" className={styles.text}>
                Choose which crew member gets a card. None of these are for you, so ask the others what they need.
                <strong className={styles.blocked}>The ship can&apos;t leave until you choose.</strong>
            </p>

            <ul className={classNames(cardGridStyles.grid, cardGridStyles.centred)} aria-label="Salvaged cards">
                {cards.map(({ role, card, deckSize, maxDeckSize }) => {
                    const name = crewRoleLabels[role].name;
                    const full = deckSize >= maxDeckSize;

                    return (
                        <li key={card.id} className={classNames(cardGridStyles.item, crewStyles[role])}>
                            <span className={styles.recipient}>
                                {name}
                                <span className={classNames(styles.deckSize, full ? styles.full : null)} title={full ? `${name}'s deck is full, so they'd replace a card` : undefined}>
                                    {`${deckSize}/${maxDeckSize}`}
                                </span>
                            </span>
                            <GridCard card={card} action={<Button palette="good" onClick={() => takeSalvage(card.id)}>{`Give to ${name}`}</Button>} />
                        </li>
                    );
                })}
            </ul>

            <Button className={styles.scrap} palette="energy" outlined onClick={scrapSalvage} endIcon={<AntimatterIcon />}>
                {`Scrap all for ${cardSellPrice}`}
            </Button>
        </section>
    </div>
);
