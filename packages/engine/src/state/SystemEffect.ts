import { ArraySchema, Schema, type } from '@colyseus/schema';
import { SystemEffectInstance } from 'common-data/features/ships/types/SystemEffectDefinition';
import { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { CooldownState } from './CooldownState';

export class SystemEffect extends Schema implements SystemEffectInstance {
    constructor(type: SystemEffectType, progress?: CooldownState) {
        super();

        this.type = type;
        if (progress) {
            this.progress.push(progress);
        }
    }

    @type('string') type: SystemEffectType;

    @type([CooldownState]) progress = new ArraySchema<CooldownState>();
}
