import { FC } from 'react';
import styles from './GameEndedDisplay.module.css';
import type { GameOutcome } from 'common-data/features/sectors/types/GamePhase';

type Props = {
    outcome: GameOutcome | null;
};

const banners: Record<GameOutcome, { title: string; text: string }> = {
    victory: { title: 'Victory', text: 'The crew has made it through every sector.' },
    defeat: { title: 'Defeat', text: 'The ship has been lost.' },
};

export const GameEndedDisplay: FC<Props> = ({ outcome }) => {
    const banner = outcome ? banners[outcome] : { title: 'Game over', text: 'The game has ended.' };

    return (
        <section className={`${styles.root} ${outcome ? styles[outcome] : ''}`} aria-label={banner.title}>
            <h1 className={styles.title}>{banner.title}</h1>
            <p className={styles.text}>{banner.text}</p>
        </section>
    );
};
