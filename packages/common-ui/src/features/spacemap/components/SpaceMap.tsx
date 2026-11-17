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
    /** What to draw. A function is called with the server time as each frame is drawn, which suits things that change every frame. */
    objects: Record<string, GameObjectInfo> | ((time: number) => Record<string, GameObjectInfo>);
    gridColor: string;
    cellRadius: number;
    /** What to keep centered on. A function is called with the server time as each frame is drawn, which suits things that change every frame. */
    center: Vector2D | ((time: number) => Vector2D);
    /** Redraw every animation frame, rather than only when this re-renders. Combine with function values for `center` and `objects`, to animate without re-rendering. */
    animate?: boolean;
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
        animate,
    } = props;

    const timeProvider = useTimeProvider();

    const draw = (ctx: CanvasRenderingContext2D, bounds: DOMRect) => {
        const currentTime = timeProvider.getServerTime();
        const frameObjects = typeof objects === 'function' ? objects(currentTime) : objects;
        const frameCenter = typeof center === 'function' ? center(currentTime) : center;
        drawMap(ctx, bounds, gridColor, cellRadius, frameCenter, currentTime, Object.values(frameObjects), viewer, drawExtraBackground, drawExtraForeground, shipStyle);
    };

    return (
        <Canvas
            ref={ref}
            className={className}
            style={style}
            draw={draw}
            animate={animate}
        />
    );
});
