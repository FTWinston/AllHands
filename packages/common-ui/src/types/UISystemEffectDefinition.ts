import { SystemEffectDefinition } from 'common-data/features/ships/types/SystemEffectDefinition';
import { ComponentType, JSX } from 'react';

export type EffectDescriptionProps = { level?: number };

export interface SystemEffectDescription {
    name: string;
    description: JSX.Element | ComponentType<EffectDescriptionProps>;
    image: ComponentType<{ className?: string }>;
}

export type UISystemEffectDefinition = SystemEffectDefinition & SystemEffectDescription;
