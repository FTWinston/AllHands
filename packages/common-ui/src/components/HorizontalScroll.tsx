import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { FC, JSX, PropsWithChildren, useRef, useCallback, useEffect } from 'react';
import { classNames } from '../utils/classNames';
import styles from './HorizontalScroll.module.css';

export type Props = PropsWithChildren<{
    className?: string;
    contentClassName?: string;
    contentRender?: JSX.Element;
    snap?: boolean;
    /**
     * Optional callback that receives the horizontal scroll fraction (0-1) of the Viewport.
     */
    onScrollFractionChange?: (fraction: number) => void;
}>;

export const HorizontalScroll: FC<Props> = (props) => {
    const { onScrollFractionChange } = props;
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const lastFraction = useRef<number | null>(null);

    const handleScroll = useCallback(() => {
        if (!onScrollFractionChange || !viewportRef.current) {
            return;
        }
        const { scrollLeft, scrollWidth, clientWidth } = viewportRef.current;
        const maxScroll = scrollWidth - clientWidth;
        const fraction = maxScroll > 0 ? scrollLeft / maxScroll : 0;
        // Only call if changed
        if (lastFraction.current !== fraction) {
            lastFraction.current = fraction;
            onScrollFractionChange(fraction);
        }
    }, [onScrollFractionChange]);

    useEffect(() => {
        if (!onScrollFractionChange || !viewportRef.current) {
            return;
        }

        handleScroll();
    }, [onScrollFractionChange, handleScroll]);

    return (
        <ScrollArea.Root className={props.className}>
            <ScrollArea.Viewport
                className={classNames(styles.viewport, props.snap ? styles.snapViewport : undefined)}
                ref={viewportRef}
                onScroll={handleScroll}
            >
                <ScrollArea.Content
                    className={classNames(styles.content, props.contentClassName)}
                    render={props.contentRender}
                >
                    {props.children}
                </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar className={styles.scrollbar} orientation="horizontal">
                <ScrollArea.Thumb className={styles.thumb} />
            </ScrollArea.Scrollbar>
        </ScrollArea.Root>
    );
};
