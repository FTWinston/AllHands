import { Schema, type } from '@colyseus/schema';
import { SystemEffectInfo, SystemEffectType } from 'common-data/features/space/types/GameObjectInfo';
import { CooldownState } from './CooldownState';

export class SystemEffect extends Schema implements SystemEffectInfo {
    constructor(type: SystemEffectType, positive: boolean, duration?: CooldownState) {
        super();

        this.type = type;
        this.positive = positive;
        this.duration = duration;
    }

    @type('string') type: string;
    @type('boolean') positive: boolean;
    @type(CooldownState) duration?: CooldownState;
}
