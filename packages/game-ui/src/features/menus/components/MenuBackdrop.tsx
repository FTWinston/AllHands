import { FC, useEffect, useRef } from 'react';
import { drawSpaceBackground } from '../../viewscreen/effects/drawSpaceBackground';
import styles from './MenuBackdrop.module.css';

/** The view doesn't move on the menus, so the stars only twinkle. */
const viewCenter = { x: 0, y: 0 };

/** The viewscreen's deep space behind the menus, with a planet rising from the corner. */
export const MenuBackdrop: FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        let frameId: number;

        const draw = (time: number) => {
            if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }

            drawSpaceBackground(ctx, viewCenter, 1, time);
            frameId = requestAnimationFrame(draw);
        };

        frameId = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(frameId);
    }, []);

    return (
        <div className={styles.backdrop} aria-hidden="true">
            <canvas ref={canvasRef} className={styles.space} />
            <div className={styles.planet} />
        </div>
    );
};
