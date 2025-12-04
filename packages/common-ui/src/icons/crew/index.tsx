import { CrewRoleName } from 'common-data/types/CrewRole';

import { FC } from 'react';
import { default as EngineeringIcon } from './engineering.svg?react';
import { default as HelmIcon } from './helm.svg?react';
import { default as SensorsIcon } from './sensors.svg?react';
import { default as TacticalIcon } from './tactical.svg?react';

export { default as HelmIcon } from './helm.svg?react';
export { default as TacticalIcon } from './tactical.svg?react';
export { default as SensorsIcon } from './sensors.svg?react';
export { default as EngineeringIcon } from './engineering.svg?react';

type IconProps = {
    crew: CrewRoleName;
    className?: string;
};

export const CrewIcon: FC<IconProps> = ({ className, crew }) => {
    switch (crew) {
        case 'helm':
            return <HelmIcon className={className} />;
        case 'tactical':
            return <TacticalIcon className={className} />;
        case 'sensors':
            return <SensorsIcon className={className} />;
        case 'engineer':
            return <EngineeringIcon className={className} />;
        default:
            return null;
    }
};
