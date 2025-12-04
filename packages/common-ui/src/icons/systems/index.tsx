import { ShipSystem } from 'common-data/types/ShipSystem';
import { FC } from 'react';
import { EngineeringIcon, HelmIcon, SensorsIcon, TacticalIcon } from '../crew';
import { default as HullIcon } from './hull.svg?react';
import { default as ShieldsIcon } from './shield.svg?react';

export { default as HullIcon } from './hull.svg?react';
export { default as ShieldsIcon } from './shield.svg?react';

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
        case 'sensors':
            return <SensorsIcon className={className} />;
        case 'helm':
            return <HelmIcon className={className} />;
        case 'shields':
            return <ShieldsIcon className={className} />;
        case 'hull':
            return <HullIcon className={className} />;
        default:
            return null;
    }
};
