import { useRef, useEffect, forwardRef, useState, CSSProperties, useLayoutEffect, PropsWithChildren, RefObject } from 'react';
import { classNames } from 'src/utils/classNames';
import styles from './Canvas.module.css';

type Props = {
    className?: string;
    style?: CSSProperties;
    animate?: boolean;
    boundsChanged?: (bounds: DOMRect) => void;
    draw: (context: CanvasRenderingContext2D, bounds: DOMRect) => void;
};

const defaultBounds = new DOMRect(0, 0, 1, 1);

export const Canvas = forwardRef<HTMLCanvasElement, PropsWithChildren<Props>>((props, ref) => {
    const outerRef = useRef<HTMLDivElement>(null);
    let canvasRef = useRef<HTMLCanvasElement>(null);

    if (ref) {
        canvasRef = ref as RefObject<HTMLCanvasElement>;
    }

    const [bounds, setBounds] = useState<DOMRect>(defaultBounds);

    const [context, setContext] = useState<CanvasRenderingContext2D>();

    const {
        className,
        style,
        animate,
        boundsChanged,
        draw,
    } = props;

    useLayoutEffect(
        () => {
            if (!context) {
                setContext(canvasRef.current?.getContext('2d') ?? undefined);
                return;
            }

            let identifier: number | undefined;

            const performDraw = () => {
                identifier = undefined;
                context.save();

                context.translate(-bounds.x, -bounds.y);
                context.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);

                draw(context, bounds);

                context.restore();

                if (animate) {
                    identifier = requestAnimationFrame(performDraw);
                }
            };

            if (animate) {
                identifier = requestAnimationFrame(performDraw);
            } else {
                performDraw();
            }

            return () => {
                if (identifier !== undefined) {
                    cancelAnimationFrame(identifier);
                }
            };
        },
        [draw, animate, context, bounds]
    );

    const [displaySizeStyle, setDisplaySizeStyle] = useState<CSSProperties>();

    useEffect(
        () => {
            const display = canvasRef.current;

            if (!display) {
                return;
            }

            const updateCanvasSize = () => {
                const displayWidth = outerRef.current!.clientWidth;
                const displayHeight = outerRef.current!.clientHeight;

                if (display.width !== displayWidth || display.height !== displayHeight) {
                    display.width = displayWidth;
                    display.height = displayHeight;

                    setDisplaySizeStyle({
                        width: `${displayWidth}px`,
                        height: `${displayHeight}px`,
                    });

                    const bounds = new DOMRect(
                        0,
                        0,
                        displayWidth,
                        displayHeight
                    );

                    boundsChanged?.(bounds);

                    setBounds(bounds);
                }
            };

            updateCanvasSize();

            const resizeObserver = new ResizeObserver(() => updateCanvasSize());
            resizeObserver.observe(outerRef.current!);

            return () => resizeObserver.disconnect();
        },
        [boundsChanged]
    );

    return (
        <div
            className={classNames(styles.root, className)}
            style={style}
            ref={outerRef}
        >
            <canvas
                className={styles.display}
                style={displaySizeStyle}
                ref={ref}
            />
            {props.children}
        </div>
    );
});
