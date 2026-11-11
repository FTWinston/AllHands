import { LinearProgress } from 'common-ui/components/LinearProgress';
import { sounds } from 'common-ui/features/sound/sounds';
import { classNames } from 'common-ui/utils/classNames';
import { FC, useEffect } from 'react';
import { useTypeOn } from '../hooks/useTypeOn';
import hailStyles from './HailDisplay.module.css';
import styles from './PromptDisplay.module.css';
import type { PromptInfo } from 'common-data/features/sectors/types/PromptInfo';

type Props = {
    prompt: PromptInfo;
};

/**
 * What's being asked over comms, for the whole bridge to see: who's asking, what, what the answers could be, and how long is left.
 * It takes the place of anything that's just being said. Only tactical can answer, so everyone else's part is to say what they think.
 */
export const PromptDisplay: FC<Props> = ({ prompt }) => {
    const typed = useTypeOn(prompt.text);

    useEffect(() => {
        sounds.hailReceived();
    }, [prompt.text]);

    return (
        <section className={classNames(hailStyles.hail, styles.prompt)} role="status" aria-label={`${prompt.speaker} asks`}>
            <h2 className={hailStyles.speaker}>{prompt.speaker}</h2>
            <p className={hailStyles.text}>
                {/* Screen readers get the whole text at once; the typing is only for show. The untyped rest keeps its space, so nothing reflows. */}
                <span className={hailStyles.visuallyHidden}>{prompt.text}</span>
                <span aria-hidden="true">
                    {prompt.text.slice(0, typed)}
                    <span className={hailStyles.untyped}>{prompt.text.slice(typed)}</span>
                </span>
            </p>

            <ul className={styles.options} aria-label="Possible answers">
                {prompt.options.map(option => <li key={option.id} className={styles.option}>{option.label}</li>)}
            </ul>

            <div className={styles.footer}>
                <span className={styles.hint}>Waiting for tactical to answer</span>
                <LinearProgress className={styles.countdown} progress={prompt.countdown} direction="right" title="Time used" />
            </div>
        </section>
    );
};
