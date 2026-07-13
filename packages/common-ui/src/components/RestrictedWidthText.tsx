import { ComponentPropsWithoutRef, ElementType, ReactNode, useLayoutEffect, useRef } from 'react';

type Props<T extends ElementType> = {
    as?: T;
    className?: string;
    innerClassName?: string;
    children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

/**
 * Renders children inside a width-constrained container, binary-searching for the
 * largest font-size (≤ 1em relative to the container's inherited font-size) at which
 * the content fits without overflow.
 *
 * Font-size is applied to an inner wrapper, NOT the container itself, so that an
 * em-based container width (e.g. `width: 5em`) is not affected by the scaling.
 *
 * The font-size is applied imperatively (directly on the DOM node) rather than via
 * React state/style, so it is always in sync with the measurement even when the
 * computed value doesn't change between renders (which would otherwise cause React
 * to skip re-applying the style, leaving a stale value from mid-measurement).
 *
 * The binary search runs inside useLayoutEffect — synchronously before the browser
 * paints — so there is no visible intermediate state.
 */
export const RestrictedWidthText = <T extends ElementType = 'div'>({ as, className, innerClassName, children, ...rest }: Props<T>) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const container = containerRef.current;
        const inner = innerRef.current;
        if (!container || !inner) return;

        const containerWidth = container.clientWidth;

        // Reset to full size before measuring — a stale, previously-computed
        // shrunk font-size could still be applied from an earlier run, which
        // would make the content appear to fit when it wouldn't at full size.
        inner.style.fontSize = '';

        if (inner.scrollWidth <= containerWidth) {
            return;
        }

        let lo = 0, hi = 1;
        for (let i = 0; i < 10; i++) {
            const mid = (lo + hi) / 2;
            inner.style.fontSize = `${mid}em`;
            if (inner.scrollWidth <= containerWidth) {
                lo = mid;
            } else {
                hi = mid;
            }
        }
        inner.style.fontSize = `${lo}em`;
    }, [children]);

    const Container = (as ?? 'div') as ElementType;

    return (
        <Container ref={containerRef} className={className} {...rest}>
            <span ref={innerRef} className={innerClassName}>
                {children}
            </span>
        </Container>
    );
};
