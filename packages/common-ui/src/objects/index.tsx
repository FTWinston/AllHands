import { ObjectAppearance } from 'common-data/features/space/types/ObjectAppearance';
import { CSSProperties, FC } from 'react';
import { default as AfterburnIcon } from './afterburn.svg?react';
import { default as ApolloIcon } from './apollo-capsule.svg?react';
import { default as SatelliteIcon } from './beam-satellite.svg?react';
import { default as ChevronIcon } from './chevron.svg?react';
import { default as CircleIcon } from './circle.svg?react';
import { default as HypersonicIcon } from './hypersonic-bolt.svg?react';
import { default as InterceptorIcon } from './interceptor-ship.svg?react';
import { default as JetpackIcon } from './jetpack.svg?react';
import { default as PathfinderIcon } from './mars-pathfinder.svg?react';
import { default as RocketIcon } from './rocket.svg?react';
import { default as ScoutIcon } from './scout-ship.svg?react';
import { default as SpaceshipIcon } from './spaceship.svg?react';
import { default as SpiderbotIcon } from './spider-bot.svg?react';
import { default as StarfighterIcon } from './starfighter.svg?react';
import { default as StrafeIcon } from './strafe.svg?react';

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

    const iconProps = { className, style };

    switch (appearance) {
        case 'afterburn':
            return <AfterburnIcon {...iconProps} />;
        case 'apollo':
            return <ApolloIcon {...iconProps} />;
        case 'satellite':
            return <SatelliteIcon {...iconProps} />;
        case 'chevron':
            return <ChevronIcon {...iconProps} />;
        case 'circle':
            return <CircleIcon {...iconProps} />;
        case 'hypersonic':
            return <HypersonicIcon {...iconProps} />;
        case 'interceptor':
            return <InterceptorIcon {...iconProps} />;
        case 'jetpack':
            return <JetpackIcon {...iconProps} />;
        case 'pathfinder':
            return <PathfinderIcon {...iconProps} />;
        case 'rocket':
            return <RocketIcon {...iconProps} />;
        case 'scout':
            return <ScoutIcon {...iconProps} />;
        case 'spaceship':
            return <SpaceshipIcon {...iconProps} />;
        case 'spiderbot':
            return <SpiderbotIcon {...iconProps} />;
        case 'starfighter':
            return <StarfighterIcon {...iconProps} />;
        case 'strafe':
            return <StrafeIcon {...iconProps} />;
        default:
            return null;
    }
};
