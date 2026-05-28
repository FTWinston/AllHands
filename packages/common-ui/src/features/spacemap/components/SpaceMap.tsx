import { GameObjectInfo } from 'common-data/features/space/types/GameObjectInfo';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { CSSProperties, forwardRef, useContext } from 'react';
import { TimeProviderContext } from '../../../contexts/TimeProviderContext';
import { Canvas } from '../../../components/Canvas';
import { drawFunction, drawMap } from '../utils/drawMap';

type Props = {
    className?: string;
    style?: CSSProperties;
    objects: Record<string, GameObjectInfo>;
    gridColor: string;
    cellRadius: number;
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
        cellRadius,
        center,
        drawExtraForeground,
        drawExtraBackground,
    } = props;

    const timeProvider = useContext(TimeProviderContext);

    if (!timeProvider) {
        throw new Error('SpaceMap must be used within a TimeProviderContext.Provider');
    }

    const draw = (ctx: CanvasRenderingContext2D, bounds: DOMRect) => {
        const currentTime = timeProvider.getServerTime();
        drawMap(ctx, bounds, gridColor, cellRadius, center, currentTime, Object.values(objects), drawExtraBackground, drawExtraForeground);
    };

    return (
        <Canvas
            ref={ref}
            className={className}
            style={style}
            draw={draw}
        />
    );
});
