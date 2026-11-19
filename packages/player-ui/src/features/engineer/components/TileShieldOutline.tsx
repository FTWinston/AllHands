import { FC, useLayoutEffect, useRef, useState } from 'react';
import { getShieldDotPattern, getShieldTrackDasharray } from 'src/features/shields/utils/shieldOutline';
import styles from './TileShieldOutline.module.css';

type Props = {
    /** How full the shields are, as a percentage of their capacity. */
    level: number;
};

/** The distance between dots along the tile's border, in ems, so smaller tiles get fewer of them. */
const dotSpacing = 0.7;

/** How far a bevel offsets along an edge, for each unit the line is inset from it. */
const bevelInsetOffset = Math.tan(Math.PI / 8);

/**
 * The outline of a system tile, along the middle of its border, starting from its right edge and going clockwise, and its length.
 * Its top-right and bottom-left corners are bevelled by `bevel`, as the tile's are.
 *
 * The top-right bevel cuts the way to the top edge short, so the start is a little below the middle of the right edge,
 * to reach the top and bottom edges at the same distance. Then the shields drain evenly from the top and bottom.
 */
function getTilePath(width: number, height: number, bevel: number, inset: number) {
    const offset = inset * bevelInsetOffset;
    const left = inset;
    const top = inset;
    const right = width - inset;
    const bottom = height - inset;

    // Where the top-right bevel meets the top and right edges, and its length (the bottom-left one is the same).
    const bevelTopX = width - bevel + offset;
    const bevelRightY = bevel - offset;
    const bevelLength = Math.hypot(right - bevelTopX, bevelRightY - top);

    // The distance to the right of the top edge, (start - bevelRightY) + bevelLength, equals that to the bottom right corner, bottom - start.
    const start = (bottom + bevelRightY - bevelLength) / 2;

    const path = `M ${right} ${start}`
        + ` V ${bottom}`
        + ` H ${bevel - offset} L ${left} ${height - bevel + offset}`
        + ` V ${top}`
        + ` H ${bevelTopX} L ${right} ${bevelRightY}`
        + ` V ${start}`;

    const length = 2 * (right - left) + 2 * (bottom - top) - 4 * (right - bevelTopX) + 2 * bevelLength;

    return { path, length };
}

/**
 * Dots along a system tile's border, lit for the share of its shields that remain, the same way as targets' shield outlines.
 * They spread both ways from the tile's right edge, and drain from the left. Unlit dots are shown faintly.
 * It must be placed in the tile, which must be positioned.
 */
export const TileShieldOutline: FC<Props> = ({ level }) => {
    const ref = useRef<SVGSVGElement>(null);
    const [size, setSize] = useState<{ width: number; height: number; em: number } | null>(null);

    useLayoutEffect(() => {
        const element = ref.current!;

        const updateSize = () => setSize({
            width: element.clientWidth,
            height: element.clientHeight,
            em: parseFloat(getComputedStyle(element).fontSize),
        });

        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(element);

        return () => resizeObserver.disconnect();
    }, []);

    // The tile's corners are bevelled by 1.5em, and its border is 0.1em wide.
    const outline = size && size.width > 0 && size.height > 0
        ? getTilePath(size.width, size.height, size.em * 1.5, size.em * 0.05)
        : null;

    // An even number, so there's a dot opposite the start, where the two sides meet.
    const dotCount = outline ? Math.max(2, Math.round(outline.length / size!.em / dotSpacing / 2) * 2) : 0;
    const pattern = outline ? getShieldDotPattern(level, dotCount) : null;

    return (
        <svg ref={ref} className={styles.outline} aria-hidden={true}>
            {outline && (
                <>
                    <path className={styles.track} d={outline.path} pathLength={100} strokeDasharray={getShieldTrackDasharray(dotCount)} />
                    {pattern && (
                        <path
                            d={outline.path}
                            pathLength={100}
                            strokeDasharray={pattern.dasharray}
                            strokeDashoffset={pattern.dashoffset}
                        />
                    )}
                </>
            )}
        </svg>
    );
};
