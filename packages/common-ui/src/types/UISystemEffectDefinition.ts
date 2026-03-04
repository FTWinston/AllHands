import { SystemEffectDefinition } from 'common-data/features/ships/types/SystemEffectDefinition';
import { ComponentType, JSX } from 'react';

export interface SystemEffectDescription {
    name: string;
    description: JSX.Element;
    image: ComponentType<{ className?: string }>;
}

export type UISystemEffectDefinition = SystemEffectDefinition & SystemEffectDescription;
