import { Schema, type } from '@colyseus/schema';
import { SystemEffectType } from 'common-data/features/ships/utils/systemEffectDefinitions';
import { SystemEffectInstance } from '../effects/EngineSystemEffectDefinition';
import { CooldownState } from './CooldownState';

export class SystemEffect extends Schema implements SystemEffectInstance {
    constructor(type: SystemEffectType, duration?: CooldownState) {
        super();

        this.type = type;
        this.duration = duration;
    }

    @type('string') type: SystemEffectType;

    @type(CooldownState) duration?: CooldownState;
}
