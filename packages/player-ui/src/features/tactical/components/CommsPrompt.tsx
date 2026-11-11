import { Button } from 'common-ui/components/Button';
import { LinearProgress } from 'common-ui/components/LinearProgress';
import { FC } from 'react';
import styles from './CommsPrompt.module.css';
import type { PromptInfo } from 'common-data/features/sectors/types/PromptInfo';

/** What's being asked. Without a countdown, it waits for as long as it takes to answer. */
export type CommsPromptContent = Omit<PromptInfo, 'countdown'> & Partial<Pick<PromptInfo, 'countdown'>>;

type Props = {
    prompt: CommsPromptContent;
    onAnswer: (optionId: string) => void;
};

/**
 * Shown to tactical while something is being asked over comms, which the viewscreen shows to everyone.
 * It covers the rest of the screen until it's answered, or its time runs out: answering is tactical's job, and nobody else can.
 */
export const CommsPrompt: FC<Props> = ({ prompt, onAnswer }) => (
    <div className={styles.backdrop}>
        <section className={styles.prompt} role="alertdialog" aria-modal="true" aria-labelledby="comms-prompt-speaker" aria-describedby="comms-prompt-text">
            <h2 id="comms-prompt-speaker" className={styles.speaker}>{prompt.speaker}</h2>
            <p id="comms-prompt-text" className={styles.text}>{prompt.text}</p>

            <div className={styles.options}>
                {prompt.options.map(option => (
                    <Button key={option.id} className={styles.button} palette="energy" onClick={() => onAnswer(option.id)}>
                        {option.label}
                    </Button>
                ))}
            </div>

            {prompt.countdown && <LinearProgress className={styles.countdown} progress={prompt.countdown} direction="right" title="Time used" />}
        </section>
    </div>
);
