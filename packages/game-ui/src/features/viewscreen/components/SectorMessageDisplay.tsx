import { FC } from 'react';
import styles from './SectorMessageDisplay.module.css';
import type { SectorMessageInfo } from 'common-data/features/sectors/types/SectorMessageInfo';

type Props = {
    message: SectorMessageInfo;
};

export const SectorMessageDisplay: FC<Props> = ({ message }) => (
    <section className={styles.root} aria-label={message.title}>
        <h1 className={styles.title}>{message.title}</h1>
        <p className={styles.text}>{message.text}</p>
        <p className={styles.hint} role="status">Waiting for tactical to continue...</p>
    </section>
);
