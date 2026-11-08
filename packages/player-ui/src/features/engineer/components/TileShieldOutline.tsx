import { FC, useLayoutEffect, useRef, useState } from 'react';
import { getShieldDotPattern } from 'src/features/shields/utils/shieldOutline';
import styles from './TileShieldOutline.module.css';

type Props = {
    /** How full the shields are, as a percentage of their capacity. */
    level: number;
};

/** How far a bevel offsets along an edge, for each unit the line is inset from it. */
const bevelInsetOffset = Math.tan(Math.PI / 8);

/**
 * The outline of a system tile, along the middle of its border: starting from the middle of its top edge, going clockwise.
 * Its top-right and bottom-left corners are bevelled by `bevel`, as the tile's are.
 */
function getTilePath(width: number, height: number, bevel: number, inset: number) {
    const offset = inset * bevelInsetOffset;
    const right = width - inset;
    const bottom = height - inset;

    return `M ${width / 2} ${inset}`
        + ` H ${width - bevel + offset} L ${right} ${bevel - offset}`
        + ` V ${bottom}`
        + ` H ${bevel - offset} L ${inset} ${height - bevel + offset}`
        + ` V ${inset}`
        + ` H ${width / 2}`;
}

/**
 * Dots along a system tile's border, lit for the share of its shields that remain, the same way as targets' shield outlines.
 * They're centred on the top of the tile, and drain from the bottom. It must be placed in the tile, which must be positioned.
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

    const pattern = getShieldDotPattern(level);

    // The tile's corners are bevelled by 1.5em, and its border is 0.1em wide.
    const path = size && size.width > 0 && size.height > 0
        ? getTilePath(size.width, size.height, size.em * 1.5, size.em * 0.05)
        : null;

    return (
        <svg ref={ref} className={styles.outline} aria-hidden={true}>
            {path && pattern && (
                <path
                    d={path}
                    pathLength={100}
                    strokeDasharray={pattern.dasharray}
                    strokeDashoffset={pattern.dashoffset}
                />
            )}
        </svg>
    );
};
