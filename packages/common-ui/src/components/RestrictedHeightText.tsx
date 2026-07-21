import { ComponentPropsWithoutRef, ElementType, ReactNode, useLayoutEffect, useRef } from 'react';
import styles from './RestrictedHeightText.module.css';

type Props<T extends ElementType> = {
    as?: T;
    className?: string;
    children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

/**
 * Renders children inside a height-constrained container, binary-searching for the
 * largest font-size (≤ 1em relative to the container's inherited font-size) at which
 * the content fits without overflow.
 *
 * Font-size is applied to an inner wrapper, NOT the container itself, so that an
 * em-based container height (e.g. `height: 5em`) is not affected by the scaling.
 *
 * The font-size is applied imperatively (directly on the DOM node) rather than via
 * React state/style, so it is always in sync with the measurement even when the
 * computed value doesn't change between renders (which would otherwise cause React
 * to skip re-applying the style, leaving a stale value from mid-measurement).
 *
 * The binary search runs inside useLayoutEffect — synchronously before the browser
 * paints — so there is no visible intermediate state.
 */
export const RestrictedHeightText = <T extends ElementType = 'div'>({ as, className, children }: Props<T>) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const container = containerRef.current;
        const inner = innerRef.current;
        if (!container || !inner) return;

        const containerHeight = container.clientHeight;

        // Reset to full size before measuring — a stale, previously-computed
        // shrunk font-size could still be applied from an earlier run, which
        // would make the content appear to fit when it wouldn't at full size.
        inner.style.fontSize = '';

        if (inner.scrollHeight <= containerHeight) {
            return;
        }

        let lo = 0, hi = 1;
        for (let i = 0; i < 10; i++) {
            const mid = (lo + hi) / 2;
            inner.style.fontSize = `${mid}em`;
            if (inner.scrollHeight <= containerHeight) {
                lo = mid;
            } else {
                hi = mid;
            }
        }
        inner.style.fontSize = `${lo}em`;
    }, [children]);

    const Container = (as ?? 'div') as ElementType;

    return (
        <Container ref={containerRef} className={className}>
            <div ref={innerRef} className={styles.inner}>
                {children}
            </div>
        </Container>
    );
};
