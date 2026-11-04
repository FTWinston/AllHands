import { FC } from 'react';
import { ChaseLights } from 'src/components/ChaseLights';
import { useTypeOn } from '../hooks/useTypeOn';
import styles from './SectorMessageDisplay.module.css';
import type { SectorMessageInfo } from 'common-data/features/sectors/types/SectorMessageInfo';

type Props = {
    message: SectorMessageInfo;
};

export const SectorMessageDisplay: FC<Props> = ({ message }) => {
    const typed = useTypeOn(message.text);
    const isTyping = typed < message.text.length;

    return (
        <section className={styles.root} aria-label={message.title}>
            <h1 className={styles.title}>{message.title}</h1>
            <p className={styles.text}>
                {/* Screen readers get the whole text at once; the typing is only for show. The untyped rest keeps its space, so nothing reflows. */}
                <span className={styles.visuallyHidden}>{message.text}</span>
                <span aria-hidden="true">
                    {message.text.slice(0, typed)}
                    {isTyping && <span className={styles.cursor} />}
                    <span className={styles.untyped}>{message.text.slice(typed)}</span>
                </span>
            </p>
            <p className={styles.hint} role="status">Waiting for tactical to continue...</p>
            <ChaseLights />
        </section>
    );
};
