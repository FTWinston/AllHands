import { ArraySchema, Schema, type } from '@colyseus/schema';
import { CooldownState } from './CooldownState';
import type { PromptInfo, PromptOptionInfo } from 'common-data/features/sectors/types/PromptInfo';

export class PromptOptionState extends Schema implements PromptOptionInfo {
    constructor(info: PromptOptionInfo) {
        super();
        this.id = info.id;
        this.label = info.label;
    }

    @type('string') readonly id: string;
    @type('string') readonly label: string;
}

export class PromptState extends Schema implements PromptInfo {
    constructor(speaker: string, text: string, options: readonly PromptOptionInfo[], startTime: number, endTime: number) {
        super();
        this.speaker = speaker;
        this.text = text;
        this.options.push(...options.map(option => new PromptOptionState(option)));
        this.countdown = new CooldownState(startTime, endTime);
    }

    @type('string') readonly speaker: string;
    @type('string') readonly text: string;
    @type([PromptOptionState]) readonly options = new ArraySchema<PromptOptionState>();
    @type(CooldownState) readonly countdown: CooldownState;
}
