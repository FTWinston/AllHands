import { FC } from 'react';
import styles from './CommsDisplay.module.css';
import { HailDisplay } from './HailDisplay';
import { PromptDisplay } from './PromptDisplay';
import type { HailInfo } from 'common-data/features/sectors/types/HailInfo';
import type { PromptInfo } from 'common-data/features/sectors/types/PromptInfo';

type Props = {
    /** What's being said, or null while nobody is speaking. */
    hail: HailInfo | null;
    /** What's being asked, or null while nothing is. */
    prompt: PromptInfo | null;
};

/**
 * Everything coming in over comms, along the bottom of the viewscreen. A question that's waiting for an answer stays at the bottom,
 * and anything said while it waits appears above it, so nothing anyone says is hidden by it.
 */
export const CommsDisplay: FC<Props> = ({ hail, prompt }) => (
    <div className={styles.comms}>
        <HailDisplay hail={hail} />
        {prompt && <PromptDisplay prompt={prompt} />}
    </div>
);
