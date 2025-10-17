import { ShipAppearance } from 'common-types';
import { FC } from 'react';
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
};

export const ShipIcon: FC<IconProps> = ({ className, appearance }) => {
    switch (appearance) {
        case 'afterburn':
            return <AfterburnIcon className={className} />;
        case 'apollo':
            return <ApolloIcon className={className} />;
        case 'satellite':
            return <SatelliteIcon className={className} />;
        case 'hypersonic':
            return <HypersonicIcon className={className} />;
        case 'interceptor':
            return <InterceptorIcon className={className} />;
        case 'jetpack':
            return <JetpackIcon className={className} />;
        case 'pathfinder':
            return <PathfinderIcon className={className} />;
        case 'rocket':
            return <RocketIcon className={className} />;
        case 'scout':
            return <ScoutIcon className={className} />;
        case 'spaceship':
            return <SpaceshipIcon className={className} />;
        case 'spiderbot':
            return <SpiderbotIcon className={className} />;
        case 'starfighter':
            return <StarfighterIcon className={className} />;
        case 'strafe':
            return <StrafeIcon className={className} />;
        default:
            return null;
    }
};
