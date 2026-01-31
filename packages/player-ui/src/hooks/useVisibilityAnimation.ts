import { useEffect, useRef, useState } from 'react';

type AnimationState = 'entering' | 'visible' | 'exiting' | 'hidden';

/**
 * Hook to manage enter/exit animations for a single element.
 * Returns visibility and animation state that can be used to apply CSS classes.
 *
 * @param isPresent - Whether the element should be shown
 * @param duration - Animation duration in ms (default 200)
 * @returns Object with `visible` (whether to render) and `animationState`
 */
export function useVisibilityAnimation(isPresent: boolean, duration = 200) {
    const [animationState, setAnimationState] = useState<AnimationState>(
        isPresent ? 'visible' : 'hidden'
    );
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const frameRef = useRef<number | null>(null);
    const prevIsPresentRef = useRef(isPresent);

    useEffect(() => {
        // Only react to changes in isPresent
        if (isPresent === prevIsPresentRef.current) {
            return;
        }
        prevIsPresentRef.current = isPresent;

        // Clear any pending timers
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }

        if (isPresent) {
            // Start enter animation: first render in 'entering' state (scaled down)
            setAnimationState('entering');
            // Then on next frame, transition to 'visible' (scaled up)
            frameRef.current = requestAnimationFrame(() => {
                frameRef.current = requestAnimationFrame(() => {
                    setAnimationState('visible');
                });
            });
        } else {
            // Start exit animation
            setAnimationState('exiting');
            // After animation completes, set to hidden
            timeoutRef.current = setTimeout(() => {
                setAnimationState('hidden');
            }, duration);
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, [isPresent, duration]);

    return {
        visible: animationState !== 'hidden',
        animationState,
        isEntering: animationState === 'entering',
        isExiting: animationState === 'exiting',
    };
}
