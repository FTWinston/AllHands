import { knowableCardTypes, knowableCardTypesByRole } from 'common-data/features/cards/utils/getKnowableCardTypes';
import { Button } from 'common-ui/components/Button';
import { Screen } from 'common-ui/components/Screen';
import { Card } from 'common-ui/features/cards/components/Card';
import { CardBack } from 'common-ui/features/cards/components/CardBack';
import { FC } from 'react';
import styles from './CardCompendiumDisplay.module.css';
import type { CardType } from 'common-data/features/cards/utils/cardDefinitions';
import type { CrewRoleName } from 'common-data/features/ships/types/CrewRole';

type Props = {
    known: ReadonlySet<CardType>;
    back: () => void;
};

const roleNames: Record<CrewRoleName, string> = {
    helm: 'Helm',
    tactical: 'Tactical',
    science: 'Science',
    engineer: 'Engineer',
};

function countKnown(types: Iterable<CardType>, known: ReadonlySet<CardType>) {
    let count = 0;
    for (const type of types) {
        if (known.has(type)) {
            count++;
        }
    }
    return count;
}

/** Every card type that can be known, grouped by crew member. Ones not yet seen on this device are shown face down, so there's a sense of how many are left to find. */
export const CardCompendiumDisplay: FC<Props> = ({ known, back }) => {
    return (
        <Screen padded className={styles.screen}>
            <header className={styles.header}>
                <h1 className={styles.title}>Card compendium</h1>
                <span className={styles.count}>{`${countKnown(knowableCardTypes, known)} / ${knowableCardTypes.size}`}</span>
                <Button onClick={back}>Back</Button>
            </header>

            <div className={styles.content}>
                {(Object.entries(knowableCardTypesByRole) as [CrewRoleName, readonly CardType[]][]).map(([role, types]) => (
                    <section key={role} className={styles.section} aria-label={roleNames[role]}>
                        <h2 className={styles.sectionTitle}>
                            {roleNames[role]}
                            <span className={styles.sectionCount}>{`${countKnown(types, known)} / ${types.length}`}</span>
                        </h2>

                        <ul className={styles.list}>
                            {types.map(type => (
                                <li key={type} className={styles.item}>
                                    {known.has(type)
                                        ? <Card type={type} />
                                        : <CardBack system={role} className={styles.unknown} />}
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
        </Screen>
    );
};
