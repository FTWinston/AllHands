import { Button } from 'common-ui/components/Button';
import { FC } from 'react';
import styles from './SectorMessagePrompt.module.css';
import type { SectorMessageInfo } from 'common-data/features/sectors/types/SectorMessageInfo';

type Props = {
    message: SectorMessageInfo | null;
    onDismiss: () => void;
};

/** Shown to tactical while a sector intro/outro message is on the viewscreen. */
export const SectorMessagePrompt: FC<Props> = ({ message, onDismiss }) => (
    <section className={styles.prompt} aria-label={message?.title ?? 'Sector message'}>
        {message && (
            <>
                <h2 className={styles.title}>{message.title}</h2>
                <p className={styles.text}>{message.text}</p>
            </>
        )}
        <Button className={styles.button} onClick={onDismiss}>Continue</Button>
    </section>
);
