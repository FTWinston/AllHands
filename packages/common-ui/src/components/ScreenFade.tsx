import { FC, useEffect, useState } from 'react';
import { classNames } from '../utils/classNames';
import styles from './ScreenFade.module.css';

type Props = {
    /** Fade to black (after a short delay), or fade back in. */
    covered: boolean;
    /** Start black and fade in, e.g. when a screen first appears. */
    fadeInOnMount?: boolean;
    /** If specified, the matching element and everything above it stays visible when fading to black. */
    keepAbove?: string;
};

/** A black overlay that fades the screen out and back in, around scene changes. Blocks interaction while covering. */
export const ScreenFade: FC<Props> = ({ covered, fadeInOnMount, keepAbove }) => {
    const [mounting, setMounting] = useState(!!fadeInOnMount);
    const [top, setTop] = useState(0);

    useEffect(() => {
        if (!mounting) {
            return;
        }

        // Let the browser draw it black first, so it then transitions to clear.
        let frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => setMounting(false));
        });
        return () => cancelAnimationFrame(frame);
    }, [mounting]);

    // Measured when starting to fade out, and kept until the next fade out, so it doesn't jump while fading back in.
    useEffect(() => {
        if (covered) {
            setTop(keepAbove ? document.querySelector(keepAbove)?.getBoundingClientRect().bottom ?? 0 : 0);
        }
    }, [covered, keepAbove]);

    return (
        <div
            className={classNames(styles.fade, covered || mounting ? styles.covered : null)}
            style={{ top }}
        />
    );
};
