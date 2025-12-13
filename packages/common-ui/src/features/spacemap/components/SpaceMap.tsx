import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { ITimeProvider } from 'common-data/features/space/types/ITimeProvider';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { CSSProperties, forwardRef } from 'react';
import { Canvas } from '../../../components/Canvas';
import { classNames } from '../../../utils/classNames';
import { drawFunction, drawMap } from '../utils/drawMap';
import styles from './SpaceMap.module.css';

type Props = {
    className?: string;
    style?: CSSProperties;
    objects: Record<string, GameObjectInfo>;
    gridColor: string;
    cellRadius: number;
    timeProvider: ITimeProvider;
    center: Vector2D;
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
        drawMap(ctx, bounds, gridColor, cellRadius, center, currentTime, Object.values(objects), drawExtraBackground, drawExtraForeground);
    };

    return (
        <Canvas
            ref={ref}
            className={classNames(styles.container, className)}
            style={style}
            draw={draw}
        />
    );
});
