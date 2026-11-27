import { cardSellPrice } from 'common-data/features/ships/utils/antimatter';
import { Button } from 'common-ui/components/Button';
import crewStyles from 'common-ui/CrewColors.module.css';
import { crewRoleLabels } from 'common-ui/features/crew/utils/crewRoleLabels';
import { default as AntimatterIcon } from 'common-ui/icons/antimatter.svg?react';
import { classNames } from 'common-ui/utils/classNames';
import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';
import cardGridStyles from 'src/features/cardui/components/CardGrid.module.css';
import { GridCard } from 'src/features/cardui/components/GridCard';
import styles from './SalvagePrompt.module.css';
import type { SalvageModel } from '../types/RewardsModel';

/**
 * Shown on the map to the crew member who chooses which salvaged card the ship takes, after a fight whose objective was met.
 * The main viewscreen shows the same cards to everyone. None of them is for this crew member, so they have to ask the others what would help.
 * It covers the rest of the screen until they choose, as helm can't plot a course until then.
 * Holding a button hides it, here and on the viewscreen, so the crew can see the sector map behind it.
 */
export const SalvagePrompt: FC<SalvageModel> = ({ cards, takeSalvage, scrapSalvage, hideSalvage }) => {
    const [held, setHeld] = useState(false);
    // Read when this goes away, to let go if it's still held.
    const heldRef = useRef(false);

    const hold = (hidden: boolean) => {
        if (heldRef.current === hidden) {
            return;
        }

        heldRef.current = hidden;
        setHeld(hidden);
        hideSalvage(hidden);
    };

    useEffect(() => () => {
        if (heldRef.current) {
            heldRef.current = false;
            hideSalvage(false);
        }
    }, [hideSalvage]);

    const holdKey = (event: KeyboardEvent, hidden: boolean) => {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            hold(hidden);
        }
    };

    return (
        <div className={classNames(styles.backdrop, held ? styles.peeking : null)}>
            <section className={classNames(styles.prompt, cardGridStyles.scale)} role="alertdialog" aria-modal="true" aria-labelledby="salvage-title" aria-describedby="salvage-text">
                <h2 id="salvage-title" className={styles.title}>Salvage</h2>
                <p id="salvage-text" className={styles.text}>
                    What the ship tractored in at the end of the fight can make one of these cards. Choose which crew member gets it.
                    None of them are for you, so ask the others what they need.
                    <strong className={styles.blocked}>Helm can&apos;t plot a course until you choose.</strong>
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

                <div className={styles.actions}>
                    <Button
                        className={styles.peek}
                        outlined
                        aria-pressed={held}
                        onPointerDown={(event) => {
                            event.currentTarget.setPointerCapture(event.pointerId);
                            hold(true);
                        }}
                        onPointerUp={() => hold(false)}
                        onPointerCancel={() => hold(false)}
                        onLostPointerCapture={() => hold(false)}
                        onKeyDown={event => !event.repeat && holdKey(event, true)}
                        onKeyUp={event => holdKey(event, false)}
                        onBlur={() => hold(false)}
                        onContextMenu={event => event.preventDefault()}
                    >
                        Hold to see the map
                    </Button>

                    <Button className={styles.scrap} palette="energy" outlined onClick={scrapSalvage} endIcon={<AntimatterIcon />}>
                        {`Scrap all for ${cardSellPrice}`}
                    </Button>
                </div>
            </section>
        </div>
    );
};
