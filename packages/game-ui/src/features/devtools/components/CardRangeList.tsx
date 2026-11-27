import { Button } from 'common-ui/components/Button';
import { getCardDefinition } from 'common-ui/features/cards/utils/getUiCardDefinition';
import { classNames } from 'common-ui/utils/classNames';
import { FC } from 'react';
import { cardRangeStatusLabels } from '../utils/cardRangeLabels';
import styles from './CardRangeList.module.css';
import type { CardRangeInfo } from 'common-data/features/cards/types/CardRangeInfo';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { ShipSystem } from 'common-data/features/ships/types/ShipSystem';

type Props = {
    info: CardRangeInfo | null;
    /** Loads the card range, to try out this card. */
    go: (cardType: CardType) => void;
};

/** Dev tools: every card the card range goes through, system by system, with how each went, to jump to any of them. */
export const CardRangeList: FC<Props> = ({ info, go }) => {
    if (!info) {
        return <p>No card range info received from the server.</p>;
    }

    const counts = { pass: 0, fail: 0, skip: 0 };
    for (const card of info.cards) {
        if (card.status) {
            counts[card.status]++;
        }
    }
    const untested = info.cards.length - counts.pass - counts.fail - counts.skip;

    const systems = [...new Set(info.cards.map(card => card.system))] as ShipSystem[];

    return (
        <div className={styles.root}>
            <p className={styles.summary}>
                {`${counts.pass} passed, ${counts.fail} failed, ${counts.skip} skipped, ${untested} untested. Kept in `}
                <code>{info.progressFile}</code>
            </p>

            {systems.map(system => (
                <section key={system}>
                    <h4 className={styles.groupHeader}>{system}</h4>
                    <ul className={styles.list}>
                        {info.cards.map((card, index) => card.system === system && (
                            <li key={card.type}>
                                <Button
                                    className={classNames(styles.card, index === info.currentIndex && info.active ? styles.current : undefined)}
                                    outlined={!card.status}
                                    palette={card.status === 'pass' ? 'good' : card.status === 'fail' ? 'danger' : card.status === 'skip' ? 'grey' : undefined}
                                    title={card.note}
                                    onClick={() => go(card.type)}
                                >
                                    <span>{getCardDefinition(card.type).name}</span>
                                    {card.status && <span className={styles.status}>{cardRangeStatusLabels[card.status]}</span>}
                                    {card.note && <span className={styles.status}>✎</span>}
                                </Button>
                            </li>
                        ))}
                    </ul>
                </section>
            ))}
        </div>
    );
};
