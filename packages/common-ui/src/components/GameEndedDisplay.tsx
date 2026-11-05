import { FC } from 'react';
import styles from './GameEndedDisplay.module.css';
import type { GameOutcome } from 'common-data/features/sectors/types/GamePhase';
import type { SectorMessageInfo } from 'common-data/features/sectors/types/SectorMessageInfo';

type Props = {
    outcome: GameOutcome | null;
    /** The defeat message of the sector the crew was lost in, if any. */
    message?: SectorMessageInfo | null;
};

const banners: Record<GameOutcome, { title: string; text: string }> = {
    victory: { title: 'Victory', text: 'The crew has made it through every sector.' },
    defeat: { title: 'Defeat', text: 'The ship has been lost.' },
};

export const GameEndedDisplay: FC<Props> = ({ outcome, message }) => {
    const banner = outcome ? banners[outcome] : { title: 'Game over', text: 'The game has ended.' };

    return (
        <section className={`${styles.root} ${outcome ? styles[outcome] : ''}`} aria-label={banner.title}>
            <h1 className={styles.title}>{banner.title}</h1>
            <p className={styles.text}>{message?.kind === 'defeat' ? message.text : banner.text}</p>
        </section>
    );
};
