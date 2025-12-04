import { ShipAppearance } from 'common-data/types/ShipAppearance';
import { CSSProperties, FC } from 'react';
import { default as AfterburnIcon } from './afterburn.svg?react';
import { default as ApolloIcon } from './apollo-capsule.svg?react';
import { default as SatelliteIcon } from './beam-satellite.svg?react';
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
    appearance: ShipAppearance;
    className?: string;
    /** Horizontal offset in pixels */
    offsetX?: number;
    /** Vertical offset in pixels */
    offsetY?: number;
    /** Rotation angle in radians */
    angle?: number;
    /** Font size in em units */
    size?: number;
};

export const ShipIcon: FC<IconProps> = ({ className, appearance, offsetX, offsetY, angle, size }) => {
    const style: CSSProperties = {};

    if (offsetX || offsetY) {
        style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }

    if (angle !== undefined) {
        const rotate = `rotate(${angle}rad)`;
        if (style.transform) {
            style.transform += ` ${rotate}`;
        } else {
            style.transform = rotate;
        }
    }

    if (size !== undefined) {
        style.width = `${size}em`;
        style.height = `${size}em`;
    }

    const iconProps = { className, style };

    switch (appearance) {
        case 'afterburn':
            return <AfterburnIcon {...iconProps} />;
        case 'apollo':
            return <ApolloIcon {...iconProps} />;
        case 'satellite':
            return <SatelliteIcon {...iconProps} />;
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
