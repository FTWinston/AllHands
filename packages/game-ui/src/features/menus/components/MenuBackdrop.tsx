import { FC, useEffect, useRef } from 'react';
import { drawSpaceBackground } from '../../viewscreen/effects/drawSpaceBackground';
import styles from './MenuBackdrop.module.css';

/** The view doesn't move on the menus. */
const viewCenter = { x: 0, y: 0 };

/** The viewscreen's deep space behind the menus, with a planet rising from the corner. */
export const MenuBackdrop: FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // The viewscreen's stars twinkle, but too faintly to notice here, so this is only drawn again when its size changes.
    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;

        const draw = () => {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
            drawSpaceBackground(ctx, viewCenter, 1, 0);
        };

        const resizeObserver = new ResizeObserver(draw);
        resizeObserver.observe(canvas);
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div className={styles.backdrop} aria-hidden="true">
            <canvas ref={canvasRef} className={styles.space} />
            <div className={styles.planet} />
        </div>
    );
};
