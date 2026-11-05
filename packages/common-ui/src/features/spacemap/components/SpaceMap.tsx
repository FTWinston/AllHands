import { GameObjectInfo, RelationshipViewer } from 'common-data/features/space/types/GameObjectInfo';
import { Vector2D } from 'common-data/features/space/types/Vector2D';
import { CSSProperties, forwardRef } from 'react';
import { Canvas } from '../../../components/Canvas';
import { useTimeProvider } from '../../../hooks/useTimeProvider';
import { drawFunction, drawMap } from '../utils/drawMap';
import type { ShipMapStyle } from '../../../objects/mapSvg';

type Props = {
    className?: string;
    style?: CSSProperties;
    objects: Record<string, GameObjectInfo>;
    gridColor: string;
    cellRadius: number;
    center: Vector2D;
    viewer: RelationshipViewer;
    drawExtraForeground?: drawFunction;
    drawExtraBackground?: drawFunction;
    /** How to draw ship designs. Defaults to filled. */
    shipStyle?: ShipMapStyle;
};

export const SpaceMap = forwardRef<HTMLCanvasElement, Props>((props, ref) => {
    const {
        className,
        style,
        objects,
        gridColor,
        cellRadius,
        center,
        viewer,
        drawExtraForeground,
        drawExtraBackground,
        shipStyle,
    } = props;

    const timeProvider = useTimeProvider();

    const draw = (ctx: CanvasRenderingContext2D, bounds: DOMRect) => {
        const currentTime = timeProvider.getServerTime();
        drawMap(ctx, bounds, gridColor, cellRadius, center, currentTime, Object.values(objects), viewer, drawExtraBackground, drawExtraForeground, shipStyle);
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
