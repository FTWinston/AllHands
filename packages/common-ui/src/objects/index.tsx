import { CSSProperties, FC, SVGProps } from 'react';
import { default as ChevronIcon } from './chevron.svg?react';
import { default as CircleIcon } from './circle.svg?react';
import type { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';

type SvgComponent = FC<SVGProps<SVGSVGElement>>;

/** Every ship design's file, by its name: the same as its appearance. */
const shipFiles = import.meta.glob<SvgComponent>('./ships/*/*.svg', { query: '?react', import: 'default', eager: true });

const icons: Partial<Record<ObjectAppearance, SvgComponent>> = {
    chevron: ChevronIcon,
    circle: CircleIcon,
    ...Object.fromEntries(Object.entries(shipFiles).map(([path, icon]) => [path.replace(/^.*\/(.+)\.svg$/, '$1'), icon])),
};

type IconProps = {
    appearance: ObjectAppearance;
    className?: string;
    /** Horizontal offset in pixels */
    offsetX?: number;
    /** Vertical offset in pixels */
    offsetY?: number;
    /** Rotation angle in radians */
    angle?: number;
    /** Font size in em units */
    size?: number;
    /** Main fill color (sets the CSS `color` property, used by `fill="currentColor"` paths) */
    color?: string;
    /** Highlight fill color (sets the `--highlight` CSS variable, used by `fill="var(--highlight)"` paths) */
    highlightColor?: string;
};

export const ObjectIcon: FC<IconProps> = ({ className, appearance, offsetX, offsetY, angle, size, color, highlightColor }) => {
    const style: CSSProperties & { '--highlight'?: string } = {};

    if (offsetX || offsetY) {
        style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }

    if (angle !== undefined) {
        const rotate = `rotate(${angle}rad)`;
        style.transform = style.transform ? `${style.transform} ${rotate}` : rotate;
    }

    if (size !== undefined) {
        style.width = `${size}em`;
        style.height = `${size}em`;
    }

    if (color !== undefined) {
        style.color = color;
    }

    if (highlightColor !== undefined) {
        style['--highlight'] = highlightColor;
    }

    const Icon = icons[appearance];
    return Icon ? <Icon className={className} style={style} /> : null;
};
