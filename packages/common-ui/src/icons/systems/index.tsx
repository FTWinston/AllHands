import { ShipSystem } from 'common-data/features/ships/types/ShipSystem';
import { FC } from 'react';
import { default as EngineeringIcon } from './engineering.svg?react';
import { default as HelmIcon } from './helm.svg?react';
import { default as ReactorIcon } from './reactor.svg?react';
import { default as ScienceIcon } from './science.svg?react';
import { default as ShieldsIcon } from './shield.svg?react';
import { default as TacticalIcon } from './tactical.svg?react';

export { default as HelmIcon } from './helm.svg?react';
export { default as ReactorIcon } from './reactor.svg?react';
export { default as ScienceIcon } from './science.svg?react';
export { default as ShieldsIcon } from './shield.svg?react';
export { default as TacticalIcon } from './tactical.svg?react';
export { default as EngineeringIcon } from './engineering.svg?react';
export { default as HullIcon } from './shield.svg?react';

type IconProps = {
    system: ShipSystem;
    className?: string;
};

export const SystemIcon: FC<IconProps> = ({ className, system }) => {
    switch (system) {
        case 'engineer':
            return <EngineeringIcon className={className} />;
        case 'tactical':
            return <TacticalIcon className={className} />;
        case 'science':
            return <ScienceIcon className={className} />;
        case 'helm':
            return <HelmIcon className={className} />;
        case 'reactor':
            return <ReactorIcon className={className} />;
        case 'hull':
            return <ShieldsIcon className={className} />;
        default:
            return null;
    }
};
