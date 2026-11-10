import { sounds } from 'common-ui/features/sound/sounds';
import { FC, useEffect } from 'react';
import { useTypeOn } from '../hooks/useTypeOn';
import styles from './HailDisplay.module.css';
import type { HailInfo } from 'common-data/features/sectors/types/HailInfo';

type Props = {
    /** What's being said, or null while nobody is speaking. */
    hail: HailInfo | null;
};

/**
 * What's being said over comms during an encounter: who's speaking, and their words typed out along the bottom of the viewscreen.
 * It's only ever shown here, so it's for the whole bridge to hear. Nobody has to answer it.
 */
export const HailDisplay: FC<Props> = ({ hail }) => (hail
    // A new hail starts over, with its own chirp, and its text typed from the start.
    ? <Hail key={`${hail.speaker}\n${hail.text}`} speaker={hail.speaker} text={hail.text} />
    : null);

const Hail: FC<HailInfo> = ({ speaker, text }) => {
    const typed = useTypeOn(text);

    useEffect(() => {
        sounds.hailReceived();
    }, []);

    return (
        <section className={styles.hail} role="status" aria-label={`${speaker} says`}>
            <h2 className={styles.speaker}>{speaker}</h2>
            <p className={styles.text}>
                {/* Screen readers get the whole text at once; the typing is only for show. The untyped rest keeps its space, so nothing reflows. */}
                <span className={styles.visuallyHidden}>{text}</span>
                <span aria-hidden="true">
                    {text.slice(0, typed)}
                    <span className={styles.untyped}>{text.slice(typed)}</span>
                </span>
            </p>
        </section>
    );
};
