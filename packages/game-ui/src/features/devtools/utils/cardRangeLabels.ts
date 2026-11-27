import type { CardRangePreset, CardRangeStatus } from 'common-data/features/cards/types/CardRangeInfo';

export const cardRangePresetLabels: Record<CardRangePreset, string> = {
    targets: 'Passive targets',
    incoming: 'Targets that shoot back',
    live: 'Live hostiles',
    ally: 'Target and an ally',
    armed: 'Passive targets, weapon loaded',
    damaged: 'Passive targets, crew systems damaged',
};

export const cardRangeStatusLabels: Record<CardRangeStatus, string> = {
    pass: 'Pass',
    fail: 'Fail',
    skip: 'Skip',
};
