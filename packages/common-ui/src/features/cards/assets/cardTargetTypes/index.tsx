import { CardTargetType } from 'common-data/features/cards/types/CardTargetType';
import { FC } from 'react';
import { default as EnemyIcon } from './enemy.svg?react';
import { default as LocationIcon } from './location.svg?react';
import { default as NoTargetIcon } from './no-target.svg?react';
import { default as SystemIcon } from './system.svg?react';
import { default as WeaponSlotIcon } from './weapon-slot.svg?react';
import { default as WeaponIcon } from './weapon.svg?react';

type IconProps = {
    targetType: CardTargetType;
    className?: string;
};

export const CardTargetIcon: FC<IconProps> = ({ className, targetType }) => {
    switch (targetType) {
        case 'no-target':
            return <NoTargetIcon className={className} />;
        case 'weapon-slot':
            return <WeaponSlotIcon className={className} />;
        case 'weapon':
            return <WeaponIcon className={className} />;
        case 'system':
            return <SystemIcon className={className} />;
        case 'enemy':
            return <EnemyIcon className={className} />;
        case 'location':
            return <LocationIcon className={className} />;
        default:
            return null;
    }
};
