import { Schema, type } from '@colyseus/schema';
import { SystemEffectInstance } from 'common-data/features/ships/types/SystemEffectDefinition';
import { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { CooldownState } from './CooldownState';

export class SystemEffect extends Schema implements SystemEffectInstance {
    constructor(type: SystemEffectType, progress: CooldownState | null, level?: number) {
        super();

        this.type = type;
        this.progress = progress;
        if (level !== undefined) {
            this.level = level;
        }
    }

    @type('string') type: SystemEffectType;

    @type(CooldownState) progress: CooldownState | null = null;

    @type('uint8') level: number = 0;
}
