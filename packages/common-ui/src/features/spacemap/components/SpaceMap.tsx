import { GameObjectInfo, interpolateVector, ITimeProvider, Keyframes, Vector2D } from 'common-types';
import { CSSProperties, forwardRef } from 'react';
import { Canvas } from 'src/components/Canvas';
import { classNames } from 'src/utils/classNames';
import { drawFunction, drawMap } from '../utils/drawMap';
import styles from './SpaceMap.module.css';

type Props = {
    className?: string;
    style?: CSSProperties;
    objects: Iterable<GameObjectInfo>;
    gridColor: string;
    cellRadius: number;
    timeProvider: ITimeProvider;
    center: Keyframes<Vector2D>;
    drawExtraForeground?: drawFunction;
    drawExtraBackground?: drawFunction;
};

export const SpaceMap = forwardRef<HTMLCanvasElement, Props>((props, ref) => {
    const {
        className,
        style,
        objects,
        gridColor,
        timeProvider,
        cellRadius,
        center,
        drawExtraForeground,
        drawExtraBackground,
    } = props;

    const draw = (ctx: CanvasRenderingContext2D, bounds: DOMRect) => {
        const currentTime = timeProvider.getServerTime();
        const centerVector = interpolateVector(center, currentTime);
        drawMap(ctx, bounds, gridColor, cellRadius, centerVector, currentTime, objects, drawExtraBackground, drawExtraForeground);
    };

    return (
        <Canvas
            ref={ref}
            className={classNames(styles.container, className)}
            style={style}
            animate={true}
            draw={draw}
        />
    );
});
