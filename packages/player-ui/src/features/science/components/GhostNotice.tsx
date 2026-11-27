import { useTimeProvider } from 'common-ui/hooks/useTimeProvider';
import { FC } from 'react';
import styles from './GhostNotice.module.css';

type Props = {
    /** The game time at which science last found a sensor ghost where it expected a ship, or 0 if it never has. */
    exposedTime: number;
};

/** How long the notice stays up after a ghost is found, in milliseconds. It fades out on its own over this time, so nothing has to time it. */
const noticeDuration = 3000;

/** Tells science that what it played on a target was a sensor ghost, for a few seconds after it finds one. */
export const GhostNotice: FC<Props> = ({ exposedTime }) => {
    const timeProvider = useTimeProvider();

    if (exposedTime === 0 || timeProvider.getServerTime() - exposedTime >= noticeDuration) {
        return null;
    }

    // Keyed by when it happened, so that finding another starts the fade over.
    return (
        <div key={exposedTime} className={styles.ghostNotice} role="status">
            Sensor ghost: no ship there
        </div>
    );
};
